import axios from 'axios';
import { Contact, Campaign, Template, MessageLog, HealthResponse, GovernorateCount, PaginationMeta } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Health Check
export const healthCheck = async (): Promise<HealthResponse> => {
  const response = await api.get('/health');
  return response.data;
};

// Contacts
export const getContacts = async (params?: any): Promise<{ contacts: Contact[]; pagination: PaginationMeta }> => {
  const response = await api.get('/contacts', { params });
  return response.data;
};

export const createContact = async (contact: Omit<Contact, '_id' | 'createdAt' | 'updatedAt'>): Promise<Contact> => {
  const response = await api.post('/contacts', contact);
  return response.data;
};

export const updateContact = async (id: string, contact: Partial<Contact>): Promise<Contact> => {
  const response = await api.put(`/contacts/${id}`, contact);
  return response.data;
};

export const deleteContact = async (id: string): Promise<void> => {
  await api.delete(`/contacts/${id}`);
};

export const deleteContactsBulk = async (ids: string[]): Promise<{ deleted: number }> => {
  const response = await api.delete('/contacts/bulk', { data: { ids } });
  return response.data;
};

export const getGovernorateCounts = async (): Promise<{ counts: GovernorateCount[] }> => {
  const response = await api.get('/contacts/governorates/counts');
  return response.data;
};

// Campaigns
export const getCampaigns = async (): Promise<Campaign[]> => {
  const response = await api.get('/campaigns');
  return response.data;
};

export const createCampaign = async (campaign: Omit<Campaign, '_id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> => {
  const response = await api.post('/campaigns', campaign);
  return response.data;
};

export const updateCampaign = async (id: string, campaign: Partial<Campaign>): Promise<Campaign> => {
  const response = await api.put(`/campaigns/${id}`, campaign);
  return response.data;
};

export const deleteCampaign = async (id: string): Promise<void> => {
  await api.delete(`/campaigns/${id}`);
};

export const sendCampaign = async (id: string): Promise<Campaign> => {
  const response = await api.post(`/campaigns/${id}/send`);
  return response.data;
};

// Templates
export const getTemplates = async (): Promise<Template[]> => {
  const response = await api.get('/templates');
  return response.data;
};

export const createTemplate = async (template: Omit<Template, '_id' | 'createdAt' | 'updatedAt'>): Promise<Template> => {
  const response = await api.post('/templates', template);
  return response.data;
};

export const updateTemplate = async (id: string, template: Partial<Template>): Promise<Template> => {
  const response = await api.put(`/templates/${id}`, template);
  return response.data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/templates/${id}`);
};

// Message Logs
export const getMessageLogs = async (campaignId?: string): Promise<MessageLog[]> => {
  const params = campaignId ? { campaignId } : {};
  const response = await api.get('/message-logs', { params });
  return response.data;
};

// Auth
export const nabdaLogin = async (email: string, password: string): Promise<{ success: boolean; user: any; token: string }> => {
  const response = await api.post('/auth/nabda/login', { email, password });
  return response.data;
};

export const getInstanceInfo = async (): Promise<any> => {
  const response = await api.get('/auth/nabda/instance');
  return response.data;
};

export const selectInstance = async (instanceId: string): Promise<any> => {
  const response = await api.post('/auth/nabda/select-instance', { instanceId });
  return response.data;
};

export const getInstances = async (): Promise<any> => {
  const response = await api.get('/auth/nabda/instances');
  return response.data;
};

export const getBundles = async (): Promise<any> => {
  const response = await api.get('/auth/nabda/bundles');
  return response.data;
};

export const logout = async (): Promise<any> => {
  const response = await api.post('/auth/logout');
  return response.data;
};

// Nabda API
export const sendWhatsAppMessage = async (to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const response = await api.post('/nabda/send', { to, message });
  return response.data;
};

export const sendOTP = async (to: string, purpose: string, templateName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const response = await api.post('/nabda/otp', { to, purpose, templateName });
  return response.data;
};

export const getNabdaBalance = async (): Promise<{ balance: number; currency: string }> => {
  const response = await api.get('/nabda/balance');
  return response.data;
};

export const getNabdaTemplates = async (): Promise<any[]> => {
  const response = await api.get('/nabda/templates');
  return response.data;
};

export default api;
