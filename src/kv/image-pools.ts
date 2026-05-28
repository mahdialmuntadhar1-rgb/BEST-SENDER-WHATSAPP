import { DEFAULT_IMAGE_POOLS, seedImagePoolConfig } from '../services/image-pool.service';
import type { Env } from '../middleware/auth';

/**
 * Seed script: upload default image pool mapping to KV.
 * Run once after creating the KV namespace.
 *
 * Usage (from a one-off Worker endpoint or CLI):
 *   curl -X POST https://your-worker.dev/api/admin/seed-image-pools
 */
export async function seedImagePoolsHandler(env: Env): Promise<{ success: boolean; message: string }> {
  try {
    await seedImagePoolConfig(env.CACHE);
    return { success: true, message: 'Image pools seeded successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to seed image pools' };
  }
}

export { DEFAULT_IMAGE_POOLS };
