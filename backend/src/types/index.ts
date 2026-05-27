export interface Contact {
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  category?: string;
  governorate?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Campaign {
  _id?: string;
  name: string;
  message: string;
  templateId?: string;
  recipients: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  completedAt?: Date;
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Template {
  _id?: string;
  name: string;
  content: string;
  variables?: string[];
  category?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MessageLog {
  _id?: string;
  campaignId?: string;
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  nabdaMessageId?: string;
  error?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt?: Date;
}

export interface NabdaMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NabdaBalanceResponse {
  balance: number;
  currency: string;
}

export interface NabdaTemplate {
  id: string;
  name: string;
  category: string;
  status: string;
}
