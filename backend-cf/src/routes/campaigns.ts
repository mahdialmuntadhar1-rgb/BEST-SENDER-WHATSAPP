import { Hono } from 'hono';
import { D1Client } from '../db/d1-client';
import { normalizePhoneNumber } from '../utils/phone-normalization';
import type { Env } from '../middleware/auth';

const campaigns = new Hono<{ Bindings: Env }>();

// GET /api/campaigns - List campaigns with pagination
campaigns.get('/', async (c) => {
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
campaigns.post('/', async (c) => {
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

  return c.json({ success: true, campaign }, 201);
});

// PUT /api/campaigns/:id - Update a campaign
campaigns.put('/:id', async (c) => {
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
campaigns.delete('/:id', async (c) => {
  const db = new D1Client(c.env.DB);
  const id = c.req.param('id');

  const deleted = await db.deleteCampaign(id);

  if (!deleted) {
    return c.json({ error: 'Campaign not found' }, 404);
  }

  return c.json({ success: true, message: 'Campaign deleted successfully' });
});

// POST /api/campaigns/:id/send - Queue a campaign for sending (API only creates jobs, does NOT send)
campaigns.post('/:id/send', async (c) => {
  const db = new D1Client(c.env.DB);
  const id = c.req.param('id');
  const { apiKey, instanceId, dryRun = false, contactIds } = await c.req.json();

  const campaign = await db.getCampaignById(id);

  if (!campaign) {
    return c.json({ error: 'Campaign not found' }, 404);
  }

  // Get contacts for this campaign
  let contactsResult = await db.getContacts({ page: 1, limit: 1000 });
  let contacts = contactsResult.contacts;

  // If specific contact IDs provided, filter to those
  if (contactIds && Array.isArray(contactIds) && contactIds.length > 0) {
    contacts = contacts.filter(c => contactIds.includes(c.id));
  }

  if (dryRun) {
    // Test mode: just validate, don't queue
    return c.json({
      success: true,
      test: true,
      campaign: { id: campaign.id, name: campaign.name, message: campaign.message },
      wouldSendTo: contacts.length,
      sampleContacts: contacts.slice(0, 5).map(c => ({ name: c.name, phone: c.phone })),
    });
  }

  if (!apiKey || !instanceId) {
    return c.json({ error: 'apiKey and instanceId required for sending' }, 400);
  }

  // Update campaign status to queued
  await db.updateCampaign(id, {
    status: 'queued',
    total_recipients: contacts.length,
    pending_count: contacts.length,
    sent_count: 0,
    failed_count: 0,
  });

  // Create message_logs for all contacts with status='queued' (persisted in DB first)
  let queuedCount = 0;
  for (const contact of contacts) {
    const normalizedPhone = normalizePhoneNumber(contact.phone);
    try {
      await db.createMessageLog({
        campaign_id: id,
        recipient: normalizedPhone,
        message: campaign.message,
        status: 'queued',
      });
      queuedCount++;
    } catch (err: any) {
      console.error(`Failed to queue message for ${normalizedPhone}:`, err.message);
    }
  }

  // API returns immediately — no WhatsApp sending happens here
  return c.json({
    success: true,
    queued_count: queuedCount,
    campaign_id: id,
    status: 'queued',
    message: 'Campaign queued successfully. Use POST /api/campaigns/:id/process to start sending.',
  });
});

// POST /api/campaigns/:id/process - Process queued messages for a campaign (worker layer)
campaigns.post('/:id/process', async (c) => {
  const db = new D1Client(c.env.DB);
  const id = c.req.param('id');
  const { apiKey, instanceId, delayMs = 1500, batchSize = 100 } = await c.req.json();

  const campaign = await db.getCampaignById(id);
  if (!campaign) {
    return c.json({ error: 'Campaign not found' }, 404);
  }

  if (!apiKey || !instanceId) {
    return c.json({ error: 'apiKey and instanceId required for processing' }, 400);
  }

  // Fetch queued messages for this campaign
  const logsResult = await db.getMessageLogs({
    campaign_id: id,
    status: 'queued',
    page: 1,
    limit: batchSize,
  });

  const queuedLogs = logsResult.logs;

  if (queuedLogs.length === 0) {
    return c.json({
      success: true,
      message: 'No queued messages found for this campaign',
      processed: 0,
      campaign_status: campaign.status,
    });
  }

  // Update campaign to sending
  await db.updateCampaign(id, { status: 'sending' });

  const baseUrl = `https://api.nabdaotp.com/inst/${instanceId}`;
  let sent = 0;
  let failed = 0;

  for (const log of queuedLogs) {
    try {
      // Mark as sending
      await db.updateMessageLogStatus(log.id, 'sending');

      // Send via Nabda API
      const response = await fetch(`${baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          phone: log.recipient,
          message: log.message,
        }),
      });

      const responseData = await response.json().catch(() => ({})) as any;

      if (response.ok) {
        sent++;
        await db.updateMessageLogStatus(log.id, 'sent', {
          nabda_message_id: responseData.messageId || responseData.id || null,
        });
      } else {
        failed++;
        const err = responseData.error || responseData.message || 'Unknown error';
        await db.updateMessageLogStatus(log.id, 'failed', { error: String(err) });
      }
    } catch (error: any) {
      failed++;
      await db.updateMessageLogStatus(log.id, 'failed', { error: error.message });
    }

    // Rate limiting between messages
    if (queuedLogs.indexOf(log) < queuedLogs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Check if more queued messages remain
  const remainingResult = await db.getMessageLogs({
    campaign_id: id,
    status: 'queued',
    page: 1,
    limit: 1,
  });
  const hasMore = remainingResult.logs.length > 0;

  // Update campaign stats
  const currentCampaign = await db.getCampaignById(id);
  const newSent = (currentCampaign?.sent_count || 0) + sent;
  const newFailed = (currentCampaign?.failed_count || 0) + failed;
  const newPending = (currentCampaign?.pending_count || 0) - sent - failed;

  await db.updateCampaign(id, {
    status: hasMore ? 'sending' : 'completed',
    sent_count: newSent,
    failed_count: newFailed,
    pending_count: Math.max(0, newPending),
    ...(hasMore ? {} : { completed_at: new Date().toISOString() }),
  });

  return c.json({
    success: true,
    processed: queuedLogs.length,
    sent,
    failed,
    has_more: hasMore,
    campaign_id: id,
  });
});

export default campaigns;
