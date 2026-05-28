import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env } from './middleware/auth';
import contacts from './routes/contacts';
import campaigns from './routes/campaigns';
import uploads from './routes/uploads';
import auth from './routes/auth';
import businesses from './routes/businesses';
import { JobStatus } from './durable-objects/job-status';

export { JobStatus };

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
}));
app.use('*', logger());

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: performance.now(),
  });
});

// Routes
app.route('/api/contacts', contacts);
app.route('/api/campaigns', campaigns);
app.route('/api/uploads', uploads);
app.route('/api/auth', auth);
app.route('/api/businesses', businesses);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: err.message || 'Internal Server Error',
  }, 500);
});

export default app;
