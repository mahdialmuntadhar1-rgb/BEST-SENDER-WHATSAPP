import { Hono } from 'hono';
import { D1Client } from '../db/d1-client';
import { normalizePhoneNumber, validatePhoneNumber } from '../utils/phone-normalization';
import type { Env } from '../middleware/auth';

const nabda = new Hono<{ Bindings: Env }>();

// POST /api/nabda/send-test - Send a test message to a single contact
nabda.post('/send-test', async (c) => {
  const { phone, message, apiKey, instanceId } = await c.req.json();

  if (!phone || !message) {
    return c.json({ error: 'Phone and message are required' }, 400);
  }

  if (!apiKey || !instanceId) {
    return c.json({ error: 'apiKey and instanceId are required' }, 400);
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!validatePhoneNumber(normalizedPhone)) {
    return c.json({ error: 'Invalid Iraqi phone number. Expected format: +964XXXXXXXXXX' }, 400);
  }

  try {
    const db = new D1Client(c.env.DB);

    // Create pending log
    const log = await db.createMessageLog({
      recipient: normalizedPhone,
      message,
      status: 'pending',
    });

    const baseUrl = `https://api.nabdaotp.com/inst/${instanceId}`;

    const response = await fetch(`${baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ phone: normalizedPhone, message }),
    });

    const data = await response.json().catch(() => ({})) as any;

    if (!response.ok) {
      await db.updateMessageLogStatus(log.id, 'failed', {
        error: data.error || data.message || 'Failed to send message',
      });
      return c.json({
        success: false,
        error: data.error || 'Failed to send message',
        details: data,
      }, 400);
    }

    await db.updateMessageLogStatus(log.id, 'sent', {
      nabda_message_id: data.messageId || data.id || null,
    });

    return c.json({
      success: true,
      message_id: data.messageId || data.id,
      phone: normalizedPhone,
      status: 'sent',
      log_id: log.id,
    });
  } catch (error: any) {
    console.error('Send test message error:', error);
    return c.json({ error: error.message || 'Failed to send message' }, 500);
  }
});

// POST /api/nabda/send - Send WhatsApp message
nabda.post('/send', async (c) => {
  const { phone, message, apiKey, instanceId } = await c.req.json();

  if (!phone || !message) {
    return c.json({ error: 'Phone and message are required' }, 400);
  }

  if (!apiKey || !instanceId) {
    return c.json({ error: 'apiKey and instanceId are required' }, 400);
  }

  try {
    const baseUrl = `https://api.nabdaotp.com/inst/${instanceId}`;

    const response = await fetch(`${baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ phone, message }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return c.json({ success: false, error: data.error || 'Failed to send message' }, 400);
    }

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('Send message error:', error);
    return c.json({ error: error.message || 'Failed to send message' }, 500);
  }
});

// POST /api/nabda/otp - Send OTP
nabda.post('/otp', async (c) => {
  const { phone, purpose, templateName, apiKey, instanceId } = await c.req.json();

  if (!phone || !purpose) {
    return c.json({ error: 'Phone and purpose are required' }, 400);
  }

  if (!apiKey || !instanceId) {
    return c.json({ error: 'apiKey and instanceId are required' }, 400);
  }

  try {
    const baseUrl = `https://api.nabdaotp.com/inst/${instanceId}`;

    const response = await fetch(`${baseUrl}/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ phone, purpose, templateName }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return c.json({ success: false, error: data.error || 'Failed to send OTP' }, 400);
    }

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return c.json({ error: error.message || 'Failed to send OTP' }, 500);
  }
});

// GET /api/nabda/status - Get instance status
nabda.get('/status', async (c) => {
  const apiKey = c.req.query('apiKey');
  const instanceId = c.req.query('instanceId');

  if (!apiKey || !instanceId) {
    return c.json({ error: 'apiKey and instanceId query params required' }, 400);
  }

  try {
    const baseUrl = `https://api.nabdaotp.com/inst/${instanceId}`;

    const response = await fetch(`${baseUrl}/status`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const data = await response.json() as any;
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('Get status error:', error);
    return c.json({ error: error.message || 'Failed to get status' }, 500);
  }
});

// POST /api/nabda/webhook - Handle incoming webhooks from Nabda
nabda.post('/webhook', async (c) => {
  try {
    const body = await c.req.json();
    
    // Log the webhook event
    console.log('Received Nabda webhook:', JSON.stringify(body));

    // Handle different event types
    const { event, payload, instanceId } = body;

    if (event === 'message.sent') {
      // Update message log status
      console.log(`Message ${payload.messageId} sent to ${payload.phone}`);
    } else if (event === 'message.received') {
      // Handle incoming message
      console.log(`Message received from ${payload.phone}`);
    } else if (event === 'message.ack') {
      // Update delivery status
      console.log(`Message ${payload.messageId} status: ${payload.status}`);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// GET /api/nabda/balance - Get account balance
nabda.get('/balance', async (c) => {
  const apiKey = c.req.query('apiKey');
  const instanceId = c.req.query('instanceId');

  if (!apiKey || !instanceId) {
    return c.json({ error: 'apiKey and instanceId query params required' }, 400);
  }

  try {
    const baseUrl = `https://api.nabdaotp.com/inst/${instanceId}`;

    const response = await fetch(`${baseUrl}/balance`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const data = await response.json() as any;
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('Get balance error:', error);
    return c.json({ error: error.message || 'Failed to get balance' }, 500);
  }
});

// GET /api/nabda/templates - Get message templates
nabda.get('/templates', async (c) => {
  const apiKey = c.req.query('apiKey');
  const instanceId = c.req.query('instanceId');

  if (!apiKey || !instanceId) {
    return c.json({ error: 'apiKey and instanceId query params required' }, 400);
  }

  try {
    const baseUrl = `https://api.nabdaotp.com/inst/${instanceId}`;

    const response = await fetch(`${baseUrl}/templates`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const data = await response.json() as any;
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('Get templates error:', error);
    return c.json({ error: error.message || 'Failed to get templates' }, 500);
  }
});

export default nabda;
