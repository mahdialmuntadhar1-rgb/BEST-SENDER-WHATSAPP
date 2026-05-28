export type Language = 'arabic' | 'sorani' | 'bahdini';

export type Governorate =
  | 'Baghdad'
  | 'Basra'
  | 'Erbil'
  | 'Duhok'
  | 'Zakho'
  | 'Sulaymaniyah'
  | 'Najaf'
  | 'Karbala'
  | 'Mosul'
  | 'Kirkuk'
  | 'Anbar'
  | 'Diyala'
  | 'Wasit'
  | 'Maysan'
  | 'Dhi Qar'
  | 'Babil'
  | 'Qadisiyah'
  | 'Muthanna'
  | 'Salah ad Din'
  | 'Halabja';

export interface Contact {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  category?: string;
  governorate?: Governorate;
  language?: Language;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Campaign {
  id?: string;
  name: string;
  message: string;
  message_ar?: string;
  message_ku?: string;
  message_en?: string;
  template_id?: string;
  recipients: string[];
  status: 'draft' | 'scheduled' | 'queued' | 'sending' | 'paused' | 'completed' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  completed_at?: string;
  total_recipients?: number;
  sent_count?: number;
  failed_count?: number;
  pending_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Template {
  id?: string;
  name: string;
  content: string;
  variables?: string;
  category?: string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GovernorateCount {
  governorate: Governorate;
  count: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface MessageLog {
  id?: string;
  campaign_id?: string;
  recipient: string;
  message: string;
  status: 'queued' | 'pending' | 'sending' | 'sent' | 'delivered' | 'failed';
  nabda_message_id?: string;
  error?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}
