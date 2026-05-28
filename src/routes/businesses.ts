import { Hono } from 'hono';
import type { Env } from '../middleware/auth';
import { getImagePoolConfig, getImageForBusiness } from '../services/image-pool.service';

const businesses = new Hono<{ Bindings: Env }>();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const CACHE_TTL = 300; // 5 minutes

interface BusinessRow {
  id: string;
  name: string;
  business_type: string;
  governorate: string;
  description: string | null;
  rating: number | null;
  created_at: number;
}

interface BusinessResponse {
  id: string;
  name: string;
  business_type: string;
  governorate: string;
  description: string | null;
  rating: number;
  image_url: string;
}

interface PaginatedResponse {
  success: boolean;
  data: BusinessResponse[];
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * GET /api/businesses
 * Cursor-based pagination for O(1) performance at any scale.
 * Query params:
 *   - cursor: last business id from previous page
 *   - limit: items per page (default 20, max 50)
 *   - type: optional filter by business_type
 *   - governorate: optional filter by governorate
 */
businesses.get('/', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;

  const limit = Math.min(
    parseInt(c.req.query('limit') || String(DEFAULT_LIMIT), 10),
    MAX_LIMIT
  );
  const cursor = c.req.query('cursor');
  const typeFilter = c.req.query('type');
  const govFilter = c.req.query('governorate');

  // Try cache first for non-cursor, non-filtered first page
  const cacheKey = `businesses:list:${typeFilter || 'all'}:${govFilter || 'all'}:${cursor || 'first'}:${limit}`;
  if (!cursor) {
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as PaginatedResponse;
        c.header('CF-Cache-Status', 'HIT');
        return c.json(parsed);
      }
    } catch {
      // ignore cache miss
    }
  }

  // Build cursor-paginated query
  let rows: BusinessRow[];
  let nextCursor: string | null = null;

  if (cursor) {
    // Keyset pagination: fetch rows BEFORE the cursor (descending order)
    if (typeFilter && govFilter) {
      rows = await db
        .prepare(
          `SELECT id, name, business_type, governorate, description, rating, created_at
           FROM businesses
           WHERE business_type = ?1 AND governorate = ?2
             AND (created_at, id) < (
               SELECT created_at, id FROM businesses WHERE id = ?3
             )
           ORDER BY created_at DESC, id DESC
           LIMIT ?4`
        )
        .bind(typeFilter, govFilter, cursor, limit + 1)
        .all<BusinessRow>().then(r => r.results || []);
    } else if (typeFilter) {
      rows = await db
        .prepare(
          `SELECT id, name, business_type, governorate, description, rating, created_at
           FROM businesses
           WHERE business_type = ?1
             AND (created_at, id) < (
               SELECT created_at, id FROM businesses WHERE id = ?2
             )
           ORDER BY created_at DESC, id DESC
           LIMIT ?3`
        )
        .bind(typeFilter, cursor, limit + 1)
        .all<BusinessRow>().then(r => r.results || []);
    } else if (govFilter) {
      rows = await db
        .prepare(
          `SELECT id, name, business_type, governorate, description, rating, created_at
           FROM businesses
           WHERE governorate = ?1
             AND (created_at, id) < (
               SELECT created_at, id FROM businesses WHERE id = ?2
             )
           ORDER BY created_at DESC, id DESC
           LIMIT ?3`
        )
        .bind(govFilter, cursor, limit + 1)
        .all<BusinessRow>().then(r => r.results || []);
    } else {
      rows = await db
        .prepare(
          `SELECT id, name, business_type, governorate, description, rating, created_at
           FROM businesses
           WHERE (created_at, id) < (
             SELECT created_at, id FROM businesses WHERE id = ?1
           )
           ORDER BY created_at DESC, id DESC
           LIMIT ?2`
        )
        .bind(cursor, limit + 1)
        .all<BusinessRow>().then(r => r.results || []);
    }
  } else {
    // First page (no cursor)
    if (typeFilter && govFilter) {
      rows = await db
        .prepare(
          `SELECT id, name, business_type, governorate, description, rating, created_at
           FROM businesses
           WHERE business_type = ?1 AND governorate = ?2
           ORDER BY created_at DESC, id DESC
           LIMIT ?3`
        )
        .bind(typeFilter, govFilter, limit + 1)
        .all<BusinessRow>().then(r => r.results || []);
    } else if (typeFilter) {
      rows = await db
        .prepare(
          `SELECT id, name, business_type, governorate, description, rating, created_at
           FROM businesses
           WHERE business_type = ?1
           ORDER BY created_at DESC, id DESC
           LIMIT ?2`
        )
        .bind(typeFilter, limit + 1)
        .all<BusinessRow>().then(r => r.results || []);
    } else if (govFilter) {
      rows = await db
        .prepare(
          `SELECT id, name, business_type, governorate, description, rating, created_at
           FROM businesses
           WHERE governorate = ?1
           ORDER BY created_at DESC, id DESC
           LIMIT ?2`
        )
        .bind(govFilter, limit + 1)
        .all<BusinessRow>().then(r => r.results || []);
    } else {
      rows = await db
        .prepare(
          `SELECT id, name, business_type, governorate, description, rating, created_at
           FROM businesses
           ORDER BY created_at DESC, id DESC
           LIMIT ?1`
        )
        .bind(limit + 1)
        .all<BusinessRow>().then(r => r.results || []);
    }
  }

  // Determine if there's a next page
  const hasMore = rows.length > limit;
  if (hasMore) {
    rows = rows.slice(0, limit);
    nextCursor = rows[rows.length - 1]?.id || null;
  }

  // Load image pools (cached in-memory for 60s via KV)
  const pools = await getImagePoolConfig(cache);
  const r2BaseUrl = c.env.R2_PUBLIC_URL || 'https://pub-2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f.r2.dev';

  const data: BusinessResponse[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    business_type: row.business_type,
    governorate: row.governorate,
    description: row.description,
    rating: row.rating ?? 0,
    image_url: getImageForBusiness(row.business_type, row.id, pools, r2BaseUrl),
  }));

  const response: PaginatedResponse = {
    success: true,
    data,
    next_cursor: nextCursor,
    has_more: hasMore,
  };

  // Cache first page only
  if (!cursor) {
    c.executionCtx.waitUntil(
      cache.put(cacheKey, JSON.stringify(response), { expirationTtl: CACHE_TTL })
    );
  }

  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  return c.json(response);
});

/**
 * GET /api/businesses/types
 * Return all distinct business types with counts.
 */
businesses.get('/types', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;

  const cacheKey = 'businesses:types';
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({ success: true, types: JSON.parse(cached) });
    }
  } catch {
    // ignore
  }

  const rows = await db
    .prepare(
      `SELECT business_type, COUNT(*) as count
       FROM businesses
       GROUP BY business_type
       ORDER BY count DESC`
    )
    .all<{ business_type: string; count: number }>()
    .then(r => r.results || []);

  c.executionCtx.waitUntil(
    cache.put(cacheKey, JSON.stringify(rows), { expirationTtl: 600 })
  );

  return c.json({ success: true, types: rows });
});

/**
 * GET /api/businesses/governorates
 * Return all distinct governorates with counts.
 */
businesses.get('/governorates', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;

  const cacheKey = 'businesses:governorates';
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({ success: true, governorates: JSON.parse(cached) });
    }
  } catch {
    // ignore
  }

  const rows = await db
    .prepare(
      `SELECT governorate, COUNT(*) as count
       FROM businesses
       GROUP BY governorate
       ORDER BY count DESC`
    )
    .all<{ governorate: string; count: number }>()
    .then(r => r.results || []);

  c.executionCtx.waitUntil(
    cache.put(cacheKey, JSON.stringify(rows), { expirationTtl: 600 })
  );

  return c.json({ success: true, governorates: rows });
});

/**
 * POST /api/businesses/seed
 * Admin endpoint to seed image pools into KV (one-time setup).
 */
businesses.post('/seed', async (c) => {
  const { seedImagePoolConfig } = await import('../services/image-pool.service');
  await seedImagePoolConfig(c.env.CACHE);
  return c.json({ success: true, message: 'Image pools seeded to KV' });
});

export default businesses;
