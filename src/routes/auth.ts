import { Hono } from 'hono';
import { sign } from 'jsonwebtoken';
import { D1Client } from '../db/d1-client';
import { encrypt, hashPassword, verifyPassword } from '../utils/encryption';
import type { Env } from '../middleware/auth';

const auth = new Hono<{ Bindings: Env }>();

// POST /api/auth/nabda/login - Login with Nabda credentials
auth.post('/nabda/login', async (c) => {
  const db = new D1Client(c.env.DB);
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  try {
    // Call Nabda API to authenticate
    const nabdaResponse = await fetch(`${c.env.NABDA_API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.NABDA_API_KEY}`,
      },
      body: JSON.stringify({ email, password }),
    });

    const nabdaData = await nabdaResponse.json();

    if (!nabdaData.success || !nabdaData.token) {
      return c.json({ error: nabdaData.error || 'Authentication failed' }, 401);
    }

    // Check if user exists in our database
    let user = await db.getUserByEmail(email);

    if (!user) {
      // Create new user
      const encryptedApiKey = await encrypt(c.env.NABDA_API_KEY, c.env.ENCRYPTION_KEY);
      user = await db.createUser({
        email,
        nabda_api_key: encryptedApiKey,
        nabda_session_token: nabdaData.token,
      });
    } else {
      // Update session token
      user = await db.updateUser(user.id, {
        nabda_session_token: nabdaData.token,
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

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const decryptedApiKey = await encrypt(user.nabda_api_key, c.env.ENCRYPTION_KEY);

    const response = await fetch(`${c.env.NABDA_API_BASE_URL}/api/v1/instances/current`, {
      headers: {
        'Authorization': `Bearer ${user.nabda_session_token || decryptedApiKey}`,
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

  const { instanceId } = await c.req.json();
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

    const response = await fetch(`${c.env.NABDA_API_BASE_URL}/api/v1/auth/select-instance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.nabda_session_token}`,
      },
      body: JSON.stringify({ instanceId }),
    });

    const data = await response.json();

    if (data.success) {
      await db.updateUser(user.id, { nabda_instance_id: instanceId });
    }

    return c.json(data);
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
