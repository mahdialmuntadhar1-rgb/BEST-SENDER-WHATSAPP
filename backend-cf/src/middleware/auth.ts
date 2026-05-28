import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  CACHE: KVNamespace;
  MESSAGE_QUEUE: Queue;
  JOB_STATUS: DurableObjectNamespace;
  NABDA_API_KEY: string;
  NABDA_API_BASE_URL: string;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  CORS_ORIGIN: string;
}

export interface AuthContext extends Context {
  user?: {
    id: string;
    email: string;
  };
}

// JWT Authentication Middleware (disabled - public access)
export const requireAuth = async (c: AuthContext, next: Next) => {
  // Public access - no auth required
  await next();
};

// Optional Auth Middleware
export const optionalAuth = async (c: AuthContext, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const JWT_SECRET = c.env.JWT_SECRET;

      const decoded = verify(token, JWT_SECRET) as { id: string; email: string };
      c.user = decoded;
    }

    await next();
  } catch (error) {
    await next();
  }
};

// Rate Limiting Middleware using KV
export const rateLimit = async (c: Context, next: Next) => {
  const identifier = c.req.header('CF-Connecting-IP') || 'anonymous';
  const key = `ratelimit:${identifier}`;
  const limit = 100; // requests per minute
  const window = 60; // seconds

  try {
    const current = await c.env.CACHE.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= limit) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    await c.env.CACHE.put(key, (count + 1).toString(), { expirationTtl: window });
    await next();
  } catch (error) {
    // If KV fails, allow request (fail open)
    await next();
  }
};
