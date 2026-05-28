import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { D1Client } from '../db/d1-client';
import type { Env, AuthContext } from '../middleware/auth';

const campaigns = new Hono<{ Bindings: Env }>();

// GET /api/campaigns - List campaigns with pagination
campaigns.get('/', requireAuth, async (c: AuthContext) => {
  const db = new D1Client(c.env.DB);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');

  const result = await db.getCampaigns({ page, limit });

  return c.json({
    success: true,
    campaigns: result.campaigns,
    pagination: {
      page,
      limit,
      total: result.total,
      pages: result.pages,
    },
  });
});

// POST /api/campaigns - Create a campaign
campaigns.post('/', requireAuth, async (c: AuthContext) => {
  const db = new D1Client(c.env.DB);
  const body = await c.req.json();

  const { name, message, template_id, recipients } = body;

  if (!name || !message || !recipients) {
    return c.json({ error: 'Name, message, and recipients are required' }, 400);
  }

  const campaign = await db.createCampaign({
    name,
    message,
    template_id,
    status: 'draft',
    total_recipients: recipients.length,
    sent_count: 0,
    failed_count: 0,
    pending_count: recipients.length,
  });

  // TODO: Add recipients to campaign_recipients table
  // TODO: Queue messages for sending

  return c.json({ success: true, campaign }, 201);
});

// PUT /api/campaigns/:id - Update a campaign
campaigns.put('/:id', requireAuth, async (c: AuthContext) => {
  const db = new D1Client(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();

  const updateData: any = {};
  if (body.name) updateData.name = body.name;
  if (body.message) updateData.message = body.message;
  if (body.status) updateData.status = body.status;

  const campaign = await db.updateCampaign(id, updateData);

  if (!campaign) {
    return c.json({ error: 'Campaign not found' }, 404);
  }

  return c.json({ success: true, campaign });
});

// DELETE /api/campaigns/:id - Delete a campaign
campaigns.delete('/:id', requireAuth, async (c: AuthContext) => {
  const db = new D1Client(c.env.DB);
  const id = c.req.param('id');

  const deleted = await db.deleteCampaign(id);

  if (!deleted) {
    return c.json({ error: 'Campaign not found' }, 404);
  }

  return c.json({ success: true, message: 'Campaign deleted successfully' });
});

// POST /api/campaigns/:id/send - Send a campaign
campaigns.post('/:id/send', requireAuth, async (c: AuthContext) => {
  const db = new D1Client(c.env.DB);
  const id = c.req.param('id');

  const campaign = await db.getCampaignById(id);

  if (!campaign) {
    return c.json({ error: 'Campaign not found' }, 404);
  }

  // Update campaign status to sending
  await db.updateCampaign(id, {
    status: 'sending',
    sent_at: new Date().toISOString(),
  });

  // TODO: Queue all messages for sending
  // TODO: Update campaign stats as messages are sent

  return c.json({ success: true, campaign });
});

export default campaigns;
