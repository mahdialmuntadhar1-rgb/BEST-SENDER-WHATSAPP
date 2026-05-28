import axios from 'axios';
import { BusinessListResponse, BusinessTypeResponse, BusinessGovernorateResponse } from '../types/business';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fetch paginated businesses with cursor-based pagination.
 */
export const getBusinesses = async (params?: {
  cursor?: string;
  limit?: number;
  type?: string;
  governorate?: string;
}): Promise<BusinessListResponse> => {
  const response = await api.get('/businesses', { params });
  return response.data;
};

/**
 * Fetch all business types with counts.
 */
export const getBusinessTypes = async (): Promise<BusinessTypeResponse> => {
  const response = await api.get('/businesses/types');
  return response.data;
};

/**
 * Fetch all governorates with business counts.
 */
export const getBusinessGovernorates = async (): Promise<BusinessGovernorateResponse> => {
  const response = await api.get('/businesses/governorates');
  return response.data;
};

/**
 * Seed image pools into KV (admin only).
 */
export const seedImagePools = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/businesses/seed');
  return response.data;
};
