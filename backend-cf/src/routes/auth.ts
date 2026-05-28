import { Hono } from 'hono';
import { sign } from 'jsonwebtoken';
import { D1Client } from '../db/d1-client';
import { encrypt, decrypt } from '../utils/encryption';
import type { Env } from '../middleware/auth';

const auth = new Hono<{ Bindings: Env }>();

// POST /api/auth/nabda/login - Login with Nabda API Key
auth.post('/nabda/login', async (c) => {
  const db = new D1Client(c.env.DB);
  const { email, apiKey, instanceId } = await c.req.json();

  if (!email || !apiKey || !instanceId) {
    return c.json({ error: 'Email, API Key and Instance ID are required' }, 400);
  }

  try {
    // Verify API key by checking instance status
    const nabdaResponse = await fetch(`https://api.nabdaotp.com/inst/${instanceId}/status`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const nabdaData = await nabdaResponse.json();

    if (!nabdaResponse.ok) {
      return c.json({ error: 'Invalid API Key or Instance ID' }, 401);
    }

    // Check if user exists in our database
    let user = await db.getUserByEmail(email);
    const encryptedApiKey = await encrypt(apiKey, c.env.ENCRYPTION_KEY);

    if (!user) {
      // Create new user
      user = await db.createUser({
        email,
        nabda_api_key: encryptedApiKey,
        nabda_instance_id: instanceId,
      });
    } else {
      // Update API key and instance
      user = await db.updateUser(user.id, {
        nabda_api_key: encryptedApiKey,
        nabda_instance_id: instanceId,
      });
    }

    // Generate JWT
    const token = sign(
      { id: user.id, email: user.email },
      c.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        instanceId: user.nabda_instance_id,
      },
      token,
    });
  } catch (error: any) {
    console.error('Nabda login error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// GET /api/auth/nabda/instance - Get current instance info
auth.get('/nabda/instance', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const db = new D1Client(c.env.DB);

  try {
    const decoded = JSON.parse(atob(token.split('.')[1])) as { id: string };
    const user = await db.getUserById(decoded.id);

    if (!user || !user.nabda_instance_id) {
      return c.json({ error: 'User or instance not found' }, 404);
    }

    const decryptedApiKey = await decrypt(user.nabda_api_key, c.env.ENCRYPTION_KEY);

    const response = await fetch(`https://api.nabdaotp.com/inst/${user.nabda_instance_id}/status`, {
      headers: {
        'Authorization': `Bearer ${decryptedApiKey}`,
      },
    });

    const data = await response.json();

    return c.json({
      success: true,
      instance: data,
      currentInstanceId: user.nabda_instance_id,
    });
  } catch (error: any) {
    console.error('Get instance error:', error);
    return c.json({ error: 'Failed to get instance info' }, 500);
  }
});

// POST /api/auth/nabda/select-instance - Select instance
auth.post('/nabda/select-instance', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const { instanceId, apiKey } = await c.req.json();
  if (!instanceId) {
    return c.json({ error: 'Instance ID is required' }, 400);
  }

  const token = authHeader.replace('Bearer ', '');
  const db = new D1Client(c.env.DB);

  try {
    const decoded = JSON.parse(atob(token.split('.')[1])) as { id: string };
    const user = await db.getUserById(decoded.id);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Verify instance with provided API key or stored one
    let decryptedApiKey = apiKey;
    if (!decryptedApiKey && user.nabda_api_key) {
      decryptedApiKey = await decrypt(user.nabda_api_key, c.env.ENCRYPTION_KEY);
    }

    const response = await fetch(`https://api.nabdaotp.com/inst/${instanceId}/status`, {
      headers: {
        'Authorization': `Bearer ${decryptedApiKey}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      const encryptedApiKey = apiKey ? await encrypt(apiKey, c.env.ENCRYPTION_KEY) : user.nabda_api_key;
      await db.updateUser(user.id, { 
        nabda_instance_id: instanceId,
        nabda_api_key: encryptedApiKey,
      });
    }

    return c.json({ success: true, instance: data });
  } catch (error: any) {
    console.error('Select instance error:', error);
    return c.json({ error: 'Failed to select instance' }, 500);
  }
});

// POST /api/auth/logout - Logout
auth.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const db = new D1Client(c.env.DB);

  try {
    const decoded = JSON.parse(atob(token.split('.')[1])) as { id: string };
    const user = await db.getUserById(decoded.id);

    if (user) {
      await db.updateUser(user.id, { nabda_session_token: undefined });
    }

    return c.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return c.json({ error: 'Failed to logout' }, 500);
  }
});

export default auth;
