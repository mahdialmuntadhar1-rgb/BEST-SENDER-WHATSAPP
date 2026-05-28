import { Hono } from 'hono';
import { D1Client } from '../db/d1-client';
import type { Env } from '../middleware/auth';

const templates = new Hono<{ Bindings: Env }>();

// GET /api/templates - List templates with pagination
templates.get('/', async (c) => {
  const db = new D1Client(c.env.DB);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');

  const result = await db.getTemplates({ page, limit });

  return c.json({
    success: true,
    templates: result.templates,
    pagination: {
      page,
      limit,
      total: result.total,
      pages: result.pages,
    },
  });
});

// POST /api/templates - Create a template
templates.post('/', async (c) => {
  const db = new D1Client(c.env.DB);
  const body = await c.req.json();

  const { name, content, variables, category } = body;

  if (!name || !content) {
    return c.json({ error: 'Name and content are required' }, 400);
  }

  const template = await db.createTemplate({
    name,
    content,
    variables,
    category,
    is_active: 1,
  });

  return c.json({ success: true, template }, 201);
});

// PUT /api/templates/:id - Update a template
templates.put('/:id', async (c) => {
  const db = new D1Client(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();

  const template = await db.updateTemplate(id, body);

  if (!template) {
    return c.json({ error: 'Template not found' }, 404);
  }

  return c.json({ success: true, template });
});

// DELETE /api/templates/:id - Delete a template
templates.delete('/:id', async (c) => {
  const db = new D1Client(c.env.DB);
  const id = c.req.param('id');

  const deleted = await db.deleteTemplate(id);

  if (!deleted) {
    return c.json({ error: 'Template not found' }, 404);
  }

  return c.json({ success: true, message: 'Template deleted successfully' });
});

export default templates;
