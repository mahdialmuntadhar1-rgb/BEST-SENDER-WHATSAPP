import axios from 'axios';
import { Contact, Campaign, Template, HealthResponse, GovernorateCount, PaginationMeta } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://nabda-bulk-whatsapp.mahdialmuntadhar1.workers.dev/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

export const createContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> => {
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
export const getCampaigns = async (params?: { page?: number; limit?: number }): Promise<any> => {
  const response = await api.get('/campaigns', { params });
  return response.data;
};

export const createCampaign = async (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<Campaign> => {
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

export const pauseCampaign = async (id: string): Promise<any> => {
  const response = await api.post(`/campaigns/${id}/pause`);
  return response.data;
};

export const resumeCampaign = async (id: string): Promise<any> => {
  const response = await api.post(`/campaigns/${id}/resume`);
  return response.data;
};

export const sendCampaign = async (
  id: string,
  apiKey?: string,
  instanceId?: string,
  dryRun = false,
  contactIds?: string[]
): Promise<any> => {
  const response = await api.post(`/campaigns/${id}/send`, { apiKey, instanceId, dryRun, contactIds });
  return response.data;
};

export const processCampaign = async (
  id: string,
  apiKey: string,
  instanceId: string,
  delayMs = 1500,
  batchSize = 100
): Promise<any> => {
  const response = await api.post(`/campaigns/${id}/process`, { apiKey, instanceId, delayMs, batchSize });
  return response.data;
};

export const processAllQueued = async (
  apiKey: string,
  instanceId: string,
  delayMs = 1500,
  batchSize = 100
): Promise<any> => {
  const response = await api.post('/worker/process', { apiKey, instanceId, delayMs, batchSize });
  return response.data;
};

// Templates
export const getTemplates = async (params?: { page?: number; limit?: number }): Promise<any> => {
  const response = await api.get('/templates', { params });
  return response.data;
};

export const createTemplate = async (template: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template> => {
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
export const getMessageLogs = async (params?: { campaign_id?: string; status?: string; page?: number; limit?: number }): Promise<any> => {
  const response = await api.get('/message-logs', { params });
  return response.data;
};

export const getMessageLogById = async (id: string): Promise<any> => {
  const response = await api.get(`/message-logs/${id}`);
  return response.data;
};

export const updateMessageLogStatus = async (id: string, status: string, data?: any): Promise<any> => {
  const response = await api.put(`/message-logs/${id}/status`, { status, ...data });
  return response.data;
};

// Instance Config (stored in localStorage)
export const getStoredCredentials = () => {
  return {
    apiKey: localStorage.getItem('nabda_api_key') || '',
    instanceId: localStorage.getItem('nabda_instance_id') || '',
  };
};

export const setStoredCredentials = (apiKey: string, instanceId: string) => {
  localStorage.setItem('nabda_api_key', apiKey);
  localStorage.setItem('nabda_instance_id', instanceId);
};

// Nabda API (requires credentials)
export const sendTestMessage = async (phone: string, message: string, apiKey: string, instanceId: string): Promise<any> => {
  const response = await api.post('/nabda/send-test', { phone, message, apiKey, instanceId });
  return response.data;
};

export const sendWhatsAppMessage = async (to: string, message: string, apiKey: string, instanceId: string): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const response = await api.post('/nabda/send', { phone: to, message, apiKey, instanceId });
  return response.data;
};

export const sendOTP = async (to: string, purpose: string, apiKey: string, instanceId: string, templateName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const response = await api.post('/nabda/otp', { phone: to, purpose, templateName, apiKey, instanceId });
  return response.data;
};

export const getNabdaBalance = async (apiKey: string, instanceId: string): Promise<any> => {
  const response = await api.get('/nabda/balance', { params: { apiKey, instanceId } });
  return response.data;
};

export const getNabdaTemplates = async (apiKey: string, instanceId: string): Promise<any[]> => {
  const response = await api.get('/nabda/templates', { params: { apiKey, instanceId } });
  return response.data;
};

export const getNabdaStatus = async (apiKey: string, instanceId: string): Promise<any> => {
  const response = await api.get('/nabda/status', { params: { apiKey, instanceId } });
  return response.data;
};

export default api;
