import { Hono } from 'hono';
import { D1Client } from '../db/d1-client';
import type { Env } from '../middleware/auth';

const worker = new Hono<{ Bindings: Env }>();

// POST /api/worker/process - Process ALL queued messages across all campaigns
// This is the recovery endpoint: call it to resume sending after a crash
worker.post('/process', async (c) => {
  const db = new D1Client(c.env.DB);
  const { apiKey, instanceId, delayMs = 1500, batchSize = 100 } = await c.req.json();

  if (!apiKey || !instanceId) {
    return c.json({ error: 'apiKey and instanceId required' }, 400);
  }

  // Find all campaigns with status='queued' or 'sending'
  const campaignsResult = await db.getCampaigns({ page: 1, limit: 1000 });
  const activeCampaigns = campaignsResult.campaigns.filter(
    (c: any) => c.status === 'queued' || c.status === 'sending'
  );

  if (activeCampaigns.length === 0) {
    return c.json({
      success: true,
      message: 'No active campaigns to process',
      processed_campaigns: 0,
    });
  }

  const baseUrl = `https://api.nabdaotp.com/inst/${instanceId}`;
  const results: any[] = [];

  for (const campaign of activeCampaigns) {
    let campaignSent = 0;
    let campaignFailed = 0;
    let hasMore = true;
    let rounds = 0;

    while (hasMore && rounds < 10) {
      rounds++;

      // Fetch queued messages for this campaign
      const logsResult = await db.getMessageLogs({
        campaign_id: campaign.id,
        status: 'queued',
        page: 1,
        limit: batchSize,
      });

      const queuedLogs = logsResult.logs;
      if (queuedLogs.length === 0) {
        hasMore = false;
        break;
      }

      // Update campaign to sending
      if (campaign.status !== 'sending') {
        await db.updateCampaign(campaign.id, { status: 'sending' });
      }

      for (const log of queuedLogs) {
        try {
          await db.updateMessageLogStatus(log.id, 'sending');

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
            campaignSent++;
            await db.updateMessageLogStatus(log.id, 'sent', {
              nabda_message_id: responseData.messageId || responseData.id || null,
            });
          } else {
            campaignFailed++;
            const err = responseData.error || responseData.message || 'Unknown error';
            await db.updateMessageLogStatus(log.id, 'failed', { error: String(err) });
          }
        } catch (error: any) {
          campaignFailed++;
          await db.updateMessageLogStatus(log.id, 'failed', { error: error.message });
        }

        // Rate limiting between messages
        if (queuedLogs.indexOf(log) < queuedLogs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      // Check if more queued messages remain
      const remainingResult = await db.getMessageLogs({
        campaign_id: campaign.id,
        status: 'queued',
        page: 1,
        limit: 1,
      });
      hasMore = remainingResult.logs.length > 0;
    }

    // Update campaign stats
    const currentCampaign = await db.getCampaignById(campaign.id);
    const newSent = (currentCampaign?.sent_count || 0) + campaignSent;
    const newFailed = (currentCampaign?.failed_count || 0) + campaignFailed;
    const newPending = (currentCampaign?.pending_count || 0) - campaignSent - campaignFailed;

    await db.updateCampaign(campaign.id, {
      status: hasMore ? 'sending' : 'completed',
      sent_count: newSent,
      failed_count: newFailed,
      pending_count: Math.max(0, newPending),
      ...(hasMore ? {} : { completed_at: new Date().toISOString() }),
    });

    results.push({
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      sent: campaignSent,
      failed: campaignFailed,
      completed: !hasMore,
    });
  }

  return c.json({
    success: true,
    processed_campaigns: activeCampaigns.length,
    results,
  });
});

export default worker;
