import type { Env } from '../middleware/auth';

export interface ImagePoolConfig {
  [businessType: string]: string[];
}

export const DEFAULT_IMAGE_POOLS: ImagePoolConfig = {
  cafe: ['cafe/1.webp', 'cafe/2.webp', 'cafe/3.webp', 'cafe/4.webp'],
  restaurant: ['restaurant/1.webp', 'restaurant/2.webp', 'restaurant/3.webp', 'restaurant/4.webp'],
  doctor: ['doctor/1.webp', 'doctor/2.webp', 'doctor/3.webp'],
  lawyer: ['lawyer/1.webp', 'lawyer/2.webp', 'lawyer/3.webp'],
  gym: ['gym/1.webp', 'gym/2.webp', 'gym/3.webp'],
  salon: ['salon/1.webp', 'salon/2.webp', 'salon/3.webp'],
  retail: ['retail/1.webp', 'retail/2.webp', 'retail/3.webp'],
  hotel: ['hotel/1.webp', 'hotel/2.webp', 'hotel/3.webp'],
  auto: ['auto/1.webp', 'auto/2.webp', 'auto/3.webp'],
  education: ['education/1.webp', 'education/2.webp', 'education/3.webp'],
  tech: ['tech/1.webp', 'tech/2.webp', 'tech/3.webp'],
  real_estate: ['real_estate/1.webp', 'real_estate/2.webp', 'real_estate/3.webp'],
  entertainment: ['entertainment/1.webp', 'entertainment/2.webp', 'entertainment/3.webp'],
  other: ['other/1.webp', 'other/2.webp', 'other/3.webp'],
};

const KV_KEY = 'image_pools';
const R2_BASE_URL = 'https://pub-2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f.r2.dev'; // Replace with your public R2 URL

/**
 * Get image pool config from KV, falling back to defaults.
 */
export async function getImagePoolConfig(cache: KVNamespace): Promise<ImagePoolConfig> {
  try {
    const cached = await cache.get(KV_KEY);
    if (cached) {
      return JSON.parse(cached) as ImagePoolConfig;
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_IMAGE_POOLS;
}

/**
 * Seed the default image pool config into KV (run once at deploy).
 */
export async function seedImagePoolConfig(cache: KVNamespace): Promise<void> {
  await cache.put(KV_KEY, JSON.stringify(DEFAULT_IMAGE_POOLS));
}

/**
 * Deterministically select an image for a business based on its ID hash.
 * Same business always gets the same image (better UX + caching).
 */
export function getImageForBusiness(
  businessType: string,
  businessId: string,
  pools: ImagePoolConfig,
  r2BaseUrl: string = R2_BASE_URL
): string {
  const pool = pools[businessType] || pools['other'];
  // Deterministic hash from businessId
  let hash = 0;
  for (let i = 0; i < businessId.length; i++) {
    hash = ((hash << 5) - hash + businessId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % pool.length;
  const path = pool[index];
  return `${r2BaseUrl}/business-images/${path}`;
}

/**
 * Override the R2 base URL (e.g. from env vars).
 */
export function setR2BaseUrl(url: string): void {
  // This is a no-op at runtime; callers pass r2BaseUrl directly.
  // Kept for API compatibility if we switch to module-level state later.
}
