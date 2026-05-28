import { Hono } from 'hono';
import { D1Client } from '../db/d1-client';
import type { Env } from '../middleware/auth';

const shakuAuth = new Hono<{ Bindings: Env }>();

// Simple password hash using PBKDF2
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const combined = new Uint8Array(atob(stored).split('').map(c => c.charCodeAt(0)));
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const hash = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    const hashArray = new Uint8Array(hash);
    if (hashArray.length !== storedHash.length) return false;
    return hashArray.every((val, i) => val === storedHash[i]);
  } catch {
    return false;
  }
}

// Simple JWT using Web Crypto HMAC
async function signJWT(payload: object, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const b64Header = btoa(JSON.stringify(header)).replace(/=/g, '');
  const b64Payload = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })).replace(/=/g, '');
  const data = `${b64Header}.${b64Payload}`;
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const b64Sig = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '');
  return `${data}.${b64Sig}`;
}

async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const valid = await crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(s).split('').map(c => c.charCodeAt(0))), encoder.encode(`${h}.${p}`));
    if (!valid) return null;
    return JSON.parse(atob(p));
  } catch {
    return null;
  }
}

// CORS middleware for billboard3dnakedeye-mor
shakuAuth.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (c.req.method === 'OPTIONS') return c.text('', 204);
  await next();
});

// POST /api/shaku-auth/register
shakuAuth.post('/register', async (c) => {
  const db = new D1Client(c.env.DB);
  const body = await c.req.json();
  const { email, password, display_name, role = 'user' } = body;

  if (!email || !password || !display_name) {
    return c.json({ error: 'Email, password, and display name are required' }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters' }, 400);
  }

  const existing = await db.getShakuUserByEmail(email.trim().toLowerCase());
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await db.createShakuUser({
    email: email.trim().toLowerCase(),
    password_hash: passwordHash,
    display_name: display_name.trim(),
    role: role === 'owner' ? 'owner' : 'user',
    photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    onboarded: 0,
    business_id: null,
  });

  const token = await signJWT({ uid: user.id, email: user.email, role: user.role }, c.env.JWT_SECRET || 'default-secret-change-me');

  return c.json({
    success: true,
    token,
    user: {
      uid: user.id,
      email: user.email,
      displayName: user.display_name,
      photoURL: user.photo_url,
      role: user.role,
      onboarded: user.onboarded,
      businessId: user.business_id,
    },
  }, 201);
});

// POST /api/shaku-auth/login
shakuAuth.post('/login', async (c) => {
  const db = new D1Client(c.env.DB);
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const user = await db.getShakuUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const token = await signJWT({ uid: user.id, email: user.email, role: user.role }, c.env.JWT_SECRET || 'default-secret-change-me');

  return c.json({
    success: true,
    token,
    user: {
      uid: user.id,
      email: user.email,
      displayName: user.display_name,
      photoURL: user.photo_url,
      role: user.role,
      onboarded: user.onboarded,
      businessId: user.business_id,
    },
  });
});

// GET /api/shaku-auth/me
shakuAuth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET || 'default-secret-change-me');
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const db = new D1Client(c.env.DB);
  const user = await db.getShakuUserById(payload.uid);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({
    success: true,
    user: {
      uid: user.id,
      email: user.email,
      displayName: user.display_name,
      photoURL: user.photo_url,
      role: user.role,
      onboarded: user.onboarded,
      businessId: user.business_id,
    },
  });
});

// POST /api/shaku-auth/reset-request
shakuAuth.post('/reset-request', async (c) => {
  const db = new D1Client(c.env.DB);
  const body = await c.req.json();
  const { email } = body;

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const user = await db.getShakuUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return c.json({ error: 'No account found with this email' }, 404);
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour
  await db.createPasswordReset(email.trim().toLowerCase(), token, expiresAt);

  // Return token in response (user can use it directly since email services may be blocked)
  return c.json({
    success: true,
    message: 'Password reset token generated',
    token,
    expires_at: expiresAt,
  });
});

// POST /api/shaku-auth/reset-confirm
shakuAuth.post('/reset-confirm', async (c) => {
  const db = new D1Client(c.env.DB);
  const body = await c.req.json();
  const { token, new_password } = body;

  if (!token || !new_password) {
    return c.json({ error: 'Token and new password are required' }, 400);
  }
  if (new_password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters' }, 400);
  }

  const reset = await db.getPasswordResetByToken(token);
  if (!reset || reset.used || new Date(reset.expires_at) < new Date()) {
    return c.json({ error: 'Invalid or expired reset token' }, 400);
  }

  const passwordHash = await hashPassword(new_password);
  await db.updateShakuUserPassword(reset.email, passwordHash);
  await db.markPasswordResetUsed(token);

  return c.json({ success: true, message: 'Password updated successfully' });
});

export default shakuAuth;
