import { Hono } from 'hono';
import { D1Client } from '../db/d1-client';
import type { Env } from '../middleware/auth';

const messageLogs = new Hono<{ Bindings: Env }>();

// GET /api/message-logs - List message logs with optional filters
messageLogs.get('/', async (c) => {
  const db = new D1Client(c.env.DB);
  const campaignId = c.req.query('campaign_id');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');

  const result = await db.getMessageLogs({
    campaign_id: campaignId || undefined,
    status: status || undefined,
    page,
    limit,
  });

  return c.json({
    success: true,
    logs: result.logs,
    pagination: {
      page,
      limit,
      total: result.total,
      pages: result.pages,
    },
  });
});

// GET /api/message-logs/:id - Get a single message log
messageLogs.get('/:id', async (c) => {
  const db = new D1Client(c.env.DB);
  const id = c.req.param('id');

  const log = await db.getMessageLogById(id);

  if (!log) {
    return c.json({ error: 'Message log not found' }, 404);
  }

  return c.json({ success: true, log });
});

// PUT /api/message-logs/:id/status - Update message log status (for webhook callbacks)
messageLogs.put('/:id/status', async (c) => {
  const db = new D1Client(c.env.DB);
  const id = c.req.param('id');
  const { status, nabda_message_id, error, delivered_at } = await c.req.json();

  if (!status) {
    return c.json({ error: 'Status is required' }, 400);
  }

  const log = await db.updateMessageLogStatus(id, status, {
    nabda_message_id,
    error,
    delivered_at,
  });

  if (!log) {
    return c.json({ error: 'Message log not found' }, 404);
  }

  return c.json({ success: true, log });
});

export default messageLogs;
