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

// POST /api/campaigns/:id/send - Send a campaign (or test/dry-run)
campaigns.post('/:id/send', async (c) => {
  const db = new D1Client(c.env.DB);
  const id = c.req.param('id');
  const { apiKey, instanceId, dryRun = false, delayMs = 1500, contactIds } = await c.req.json();

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
    // Test mode: just validate, don't send
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

  const baseUrl = `https://api.nabdaotp.com/inst/${instanceId}`;

  // Update campaign status to sending
  await db.updateCampaign(id, {
    status: 'sending',
    sent_at: new Date().toISOString(),
    total_recipients: contacts.length,
    pending_count: contacts.length,
  });

  // Send messages via Nabda API with rate limiting
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const results: any[] = [];

  for (const contact of contacts) {
    const normalizedPhone = normalizePhoneNumber(contact.phone);
    let logId: string | null = null;

    try {
      // Create pending message log
      const log = await db.createMessageLog({
        campaign_id: id,
        recipient: normalizedPhone,
        message: campaign.message,
        status: 'pending',
      });
      logId = log.id;

      // Send via Nabda API
      const response = await fetch(`${baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          message: campaign.message,
        }),
      });

      const responseData = await response.json().catch(() => ({})) as any;

      if (response.ok) {
        sent++;
        if (logId) {
          await db.updateMessageLogStatus(logId, 'sent', {
            nabda_message_id: responseData.messageId || responseData.id || null,
          });
        }
        results.push({
          contact_id: contact.id,
          phone: normalizedPhone,
          success: true,
          message_id: responseData.messageId || responseData.id,
        });
      } else {
        failed++;
        const err = responseData.error || responseData.message || await response.text().catch(() => 'Unknown error');
        errors.push(`${normalizedPhone}: ${err}`);
        if (logId) {
          await db.updateMessageLogStatus(logId, 'failed', { error: String(err) });
        }
        results.push({
          contact_id: contact.id,
          phone: normalizedPhone,
          success: false,
          error: String(err),
        });
      }
    } catch (error: any) {
      failed++;
      errors.push(`${normalizedPhone}: ${error.message}`);
      if (logId) {
        await db.updateMessageLogStatus(logId, 'failed', { error: error.message });
      }
      results.push({
        contact_id: contact.id,
        phone: normalizedPhone,
        success: false,
        error: error.message,
      });
    }

    // Rate limiting: wait before sending next message
    if (contacts.indexOf(contact) < contacts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Update campaign with final stats
  const updated = await db.updateCampaign(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    sent_count: sent,
    failed_count: failed,
    pending_count: 0,
  });

  return c.json({
    success: true,
    campaign: updated,
    stats: { sent, failed, total: contacts.length },
    results: results.slice(0, 50), // First 50 results
    errors: errors.slice(0, 10), // First 10 errors only
  });
});

export default campaigns;
