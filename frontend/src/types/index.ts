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
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  category?: string;
  governorate?: Governorate;
  language?: Language;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Campaign {
  _id?: string;
  name: string;
  message: string;
  templateId?: string;
  recipients: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Template {
  _id?: string;
  name: string;
  content: string;

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
  variables?: string[];
  category?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageLog {
  _id?: string;
  campaignId?: string;
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  nabdaMessageId?: string;
  error?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}
