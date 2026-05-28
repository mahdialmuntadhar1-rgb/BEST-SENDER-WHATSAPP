import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { D1Client } from '../db/d1-client';
import type { Env, AuthContext } from '../middleware/auth';

const uploads = new Hono<{ Bindings: Env }>();

// POST /api/uploads/presigned-url - Generate presigned URL for R2 upload
uploads.post('/presigned-url', requireAuth, async (c: AuthContext) => {
  const { fileName, fileType } = await c.req.json();

  if (!fileName || !fileType) {
    return c.json({ error: 'fileName and fileType are required' }, 400);
  }

  // Generate a unique key for the file
  const key = `uploads/${Date.now()}-${fileName}`;

  // R2 presigned URL for PUT
  const url = new URL(`https://${c.env.BUCKET.name}.${c.env.BUCKET.endpoint}/${key}`);
  
  // For simplicity, we'll use a direct upload approach
  // In production, you might want to use presigned URLs with expiration
  const uploadUrl = url.toString();

  return c.json({
    success: true,
    uploadUrl,
    key,
  });
});

// POST /api/uploads/process - Process uploaded CSV file from R2
uploads.post('/process', requireAuth, async (c: AuthContext) => {
  const db = new D1Client(c.env.DB);
  const { key, duplicateHandling = 'skip' } = await c.req.json();

  if (!key) {
    return c.json({ error: 'File key is required' }, 400);
  }

  // Get the file from R2
  const object = await c.env.BUCKET.get(key);
  
  if (!object) {
    return c.json({ error: 'File not found' }, 404);
  }

  const text = await object.text();
  const lines = text.split('\n');
  
  // Parse CSV (simple parsing - for production use a proper CSV parser)
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).filter(line => line.trim());

  let inserted = 0;
  let duplicates = 0;
  let errors = 0;
  const errorDetails: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const values = rows[i].split(',').map(v => v.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    try {
      if (!row.name || !row.phone) {
        errors++;
        errorDetails.push({ row: i + 2, message: 'Missing name or phone' });
        continue;
      }

      // Normalize phone
      const phone = row.phone.replace(/\D/g, '');
      const normalizedPhone = phone.startsWith('0') ? `+964${phone.substring(1)}` : `+964${phone}`;

      // Check for duplicate
      const existing = await db.getContacts({
        search: normalizedPhone,
        governorates: row.governorate ? [row.governorate] : undefined,
      });

      if (existing.contacts.length > 0) {
        if (duplicateHandling === 'overwrite') {
          // Update existing contact
          await db.updateContact(existing.contacts[0].id, {
            name: row.name,
            phone: normalizedPhone,
            governorate: row.governorate,
          });
          inserted++;
        } else {
          duplicates++;
        }
      } else {
        // Create new contact
        await db.createContact({
          name: row.name,
          phone: normalizedPhone,
          governorate: row.governorate,
          email: row.email,
          tags: row.tags ? row.tags.split(';') : undefined,
        });
        inserted++;
      }
    } catch (error: any) {
      errors++;
      errorDetails.push({ row: i + 2, message: error.message });
    }
  }

  // Delete the file from R2 after processing
  await c.env.BUCKET.delete(key);

  return c.json({
    success: true,
    summary: {
      total: rows.length,
      inserted,
      duplicates,
      errors,
    },
    errorDetails,
  });
});

export default uploads;
