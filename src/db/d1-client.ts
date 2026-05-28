import { D1Database } from '@cloudflare/workers-types';

export type Language = 'arabic' | 'sorani' | 'bahdini';
export type Governorate =
  | 'Baghdad' | 'Basra' | 'Erbil' | 'Duhok' | 'Zakho' | 'Sulaymaniyah'
  | 'Najaf' | 'Karbala' | 'Mosul' | 'Kirkuk' | 'Anbar' | 'Diyala' | 'Wasit'
  | 'Maysan' | 'Dhi Qar' | 'Babil' | 'Qadisiyah' | 'Muthanna' | 'Salah ad Din' | 'Halabja';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  nabda_api_key: string;
  nabda_instance_id?: string;
  nabda_bundle_id?: string;
  nabda_session_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category?: string;
  governorate?: Governorate;
  language?: Language;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  message: string;
  template_id?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  completed_at?: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  variables?: string;
  category?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface MessageLog {
  id: string;
  campaign_id?: string;
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  nabda_message_id?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface ImportJob {
  id: string;
  user_id: string;
  file_name: string;
  file_key: string;
  total_rows: number;
  processed_rows: number;
  inserted_count: number;
  duplicate_count: number;
  error_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duplicate_handling: 'skip' | 'overwrite';
  error_details?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export class D1Client {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Helper method to generate UUID
  private generateId(): string {
    return crypto.randomUUID();
  }

  // Helper method to parse JSON fields
  private parseJSON<T>(value: string | null): T | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  // Helper method to stringify JSON fields
  private stringifyJSON(value: any): string | null {
    if (value === null || value === undefined) return null;
    return JSON.stringify(value);
  }

  // ==================== USERS ====================
  async createUser(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    await this.db.prepare(
      `INSERT INTO users (id, email, password_hash, nabda_api_key, nabda_instance_id, nabda_bundle_id, nabda_session_token, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.email,
      data.password_hash || null,
      data.nabda_api_key,
      data.nabda_instance_id || null,
      data.nabda_bundle_id || null,
      data.nabda_session_token || null,
      now,
      now
    ).run();

    return { ...data, id, created_at: now, updated_at: now };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    return result as User | null;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    return result as User | null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.nabda_session_token !== undefined) {
      updates.push('nabda_session_token = ?');
      values.push(data.nabda_session_token);
    }
    if (data.nabda_instance_id !== undefined) {
      updates.push('nabda_instance_id = ?');
      values.push(data.nabda_instance_id);
    }
    if (data.nabda_bundle_id !== undefined) {
      updates.push('nabda_bundle_id = ?');
      values.push(data.nabda_bundle_id);
    }

    if (updates.length === 0) return await this.getUserById(id);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return await this.getUserById(id);
  }

  // ==================== CONTACTS ====================
  async createContact(data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    await this.db.prepare(
      `INSERT INTO contacts (id, name, phone, email, category, governorate, language, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.name,
      data.phone,
      data.email || null,
      data.category || null,
      data.governorate || null,
      data.language || null,
      this.stringifyJSON(data.tags) || null,
      now,
      now
    ).run();

    return { ...data, id, created_at: now, updated_at: now };
  }

  async getContacts(params: {
    page?: number;
    limit?: number;
    search?: string;
    governorates?: Governorate[];
  }): Promise<{ contacts: Contact[]; total: number; pages: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const values: any[] = [];

    if (params.search) {
      whereClause += ' AND (name LIKE ? OR phone LIKE ?)';
      values.push(`%${params.search}%`, `%${params.search}%`);
    }

    if (params.governorates && params.governorates.length > 0) {
      const placeholders = params.governorates.map(() => '?').join(',');
      whereClause += ` AND governorate IN (${placeholders})`;
      values.push(...params.governorates);
    }

    const [contactsResult, countResult] = await Promise.all([
      this.db.prepare(
        `SELECT * FROM contacts WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).bind(...values, limit, offset).all(),
      this.db.prepare(
        `SELECT COUNT(*) as count FROM contacts WHERE ${whereClause}`
      ).bind(...values).first()
    ]);

    const total = (countResult as any)?.count || 0;
    const pages = Math.ceil(total / limit);

    const contacts = (contactsResult.results || []).map((row: any) => ({
      ...row,
      tags: this.parseJSON<string[]>(row.tags),
    })) as Contact[];

    return { contacts, total, pages };
  }

  async getContactById(id: string): Promise<Contact | null> {
    const result = await this.db.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first();
    if (!result) return null;
    return {
      ...result,
      tags: this.parseJSON<string[]>((result as any).tags),
    } as Contact;
  }

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.governorate !== undefined) {
      updates.push('governorate = ?');
      values.push(data.governorate);
    }
    if (data.language !== undefined) {
      updates.push('language = ?');
      values.push(data.language);
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      values.push(this.stringifyJSON(data.tags));
    }

    if (updates.length === 0) return await this.getContactById(id);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db.prepare(
      `UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return await this.getContactById(id);
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run();
    return (result.meta?.changes || 0) > 0;
  }

  async deleteContactsBulk(ids: string[]): Promise<number> {
    const placeholders = ids.map(() => '?').join(',');
    const result = await this.db.prepare(
      `DELETE FROM contacts WHERE id IN (${placeholders})`
    ).bind(...ids).run();
    return result.meta?.changes || 0;
  }

  async getGovernorateCounts(): Promise<{ governorate: Governorate; count: number }[]> {
    const results = await this.db.prepare(
      `SELECT governorate, COUNT(*) as count FROM contacts 
       WHERE governorate IS NOT NULL 
       GROUP BY governorate 
       ORDER BY count DESC`
    ).all();

    return (results.results || []).map((row: any) => ({
      governorate: row.governorate as Governorate,
      count: row.count,
    }));
  }

  // ==================== CAMPAIGNS ====================
  async createCampaign(data: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<Campaign> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    await this.db.prepare(
      `INSERT INTO campaigns (id, name, message, template_id, status, scheduled_at, sent_at, completed_at, total_recipients, sent_count, failed_count, pending_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.name,
      data.message,
      data.template_id || null,
      data.status,
      data.scheduled_at || null,
      data.sent_at || null,
      data.completed_at || null,
      data.total_recipients,
      data.sent_count,
      data.failed_count,
      data.pending_count,
      now,
      now
    ).run();

    return { ...data, id, created_at: now, updated_at: now };
  }

  async getCampaigns(params: { page?: number; limit?: number }): Promise<{ campaigns: Campaign[]; total: number; pages: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    const [campaignsResult, countResult] = await Promise.all([
      this.db.prepare(
        'SELECT * FROM campaigns ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(limit, offset).all(),
      this.db.prepare('SELECT COUNT(*) as count FROM campaigns').first()
    ]);

    const total = (countResult as any)?.count || 0;
    const pages = Math.ceil(total / limit);

    return {
      campaigns: campaignsResult.results as Campaign[],
      total,
      pages,
    };
  }

  async getCampaignById(id: string): Promise<Campaign | null> {
    const result = await this.db.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
    return result as Campaign | null;
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.message !== undefined) {
      updates.push('message = ?');
      values.push(data.message);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.sent_count !== undefined) {
      updates.push('sent_count = ?');
      values.push(data.sent_count);
    }
    if (data.failed_count !== undefined) {
      updates.push('failed_count = ?');
      values.push(data.failed_count);
    }
    if (data.pending_count !== undefined) {
      updates.push('pending_count = ?');
      values.push(data.pending_count);
    }

    if (updates.length === 0) return await this.getCampaignById(id);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db.prepare(
      `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return await this.getCampaignById(id);
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM campaigns WHERE id = ?').bind(id).run();
    return (result.meta?.changes || 0) > 0;
  }

  // ==================== IMPORT JOBS ====================
  async createImportJob(data: Omit<ImportJob, 'id' | 'created_at'>): Promise<ImportJob> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    await this.db.prepare(
      `INSERT INTO import_jobs (id, user_id, file_name, file_key, total_rows, processed_rows, inserted_count, duplicate_count, error_count, status, duplicate_handling, error_details, started_at, completed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.user_id,
      data.file_name,
      data.file_key,
      data.total_rows,
      data.processed_rows,
      data.inserted_count,
      data.duplicate_count,
      data.error_count,
      data.status,
      data.duplicate_handling,
      this.stringifyJSON(data.error_details) || null,
      data.started_at || null,
      data.completed_at || null,
      now
    ).run();

    return { ...data, id, created_at: now };
  }

  async updateImportJob(id: string, data: Partial<ImportJob>): Promise<ImportJob | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.processed_rows !== undefined) {
      updates.push('processed_rows = ?');
      values.push(data.processed_rows);
    }
    if (data.inserted_count !== undefined) {
      updates.push('inserted_count = ?');
      values.push(data.inserted_count);
    }
    if (data.duplicate_count !== undefined) {
      updates.push('duplicate_count = ?');
      values.push(data.duplicate_count);
    }
    if (data.error_count !== undefined) {
      updates.push('error_count = ?');
      values.push(data.error_count);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.error_details !== undefined) {
      updates.push('error_details = ?');
      values.push(this.stringifyJSON(data.error_details));
    }
    if (data.started_at !== undefined) {
      updates.push('started_at = ?');
      values.push(data.started_at);
    }
    if (data.completed_at !== undefined) {
      updates.push('completed_at = ?');
      values.push(data.completed_at);
    }

    if (updates.length === 0) return await this.getImportJobById(id);

    values.push(id);

    await this.db.prepare(
      `UPDATE import_jobs SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return await this.getImportJobById(id);
  }

  async getImportJobById(id: string): Promise<ImportJob | null> {
    const result = await this.db.prepare('SELECT * FROM import_jobs WHERE id = ?').bind(id).first();
    if (!result) return null;
    return {
      ...result,
      error_details: this.parseJSON<any>((result as any).error_details),
    } as ImportJob;
  }

  async getImportJobsByUserId(userId: string): Promise<ImportJob[]> {
    const results = await this.db.prepare(
      'SELECT * FROM import_jobs WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();

    return (results.results || []).map((row: any) => ({
      ...row,
      error_details: this.parseJSON<any>(row.error_details),
    })) as ImportJob[];
  }
}
