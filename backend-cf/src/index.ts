import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env } from './middleware/auth';
import contacts from './routes/contacts';
import campaigns from './routes/campaigns';
import templates from './routes/templates';
import uploads from './routes/uploads';
import auth from './routes/auth';
import nabda from './routes/nabda';
import messageLogs from './routes/message-logs';
import shakuAuth from './routes/shaku-auth';
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
app.route('/api/templates', templates);
app.route('/api/uploads', uploads);
app.route('/api/auth', auth);
app.route('/api/nabda', nabda);
app.route('/api/message-logs', messageLogs);
app.route('/api/shaku-auth', shakuAuth);

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
