import axios, { AxiosInstance, AxiosError } from 'axios';
import { NabdaMessageResponse, NabdaBalanceResponse, NabdaTemplate } from '../types';

export interface NabdaAuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  error?: string;
}

export interface NabdaInstance {
  id: string;
  name: string;
  phone: string;
  status: 'connected' | 'disconnected' | 'pending';
  bundleId?: string;
}

export interface NabdaBundle {
  id: string;
  name: string;
  instances: NabdaInstance[];
}

export interface NabdaInstanceStatus {
  id: string;
  name: string;
  phone: string;
  status: string;
  bundleId?: string;
  apiStatus: string;
  lastActivity?: string;
}

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

class NabdaClient {
  private client: AxiosInstance;
  private apiKey: string;
  private sessionToken: string | null = null;
  private currentInstanceId: string | null = null;
  private currentBundleId: string | null = null;

  constructor(apiKey: string, baseUrl: string = 'https://api.nabdaotp.com') {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private getAuthHeader(): string {
    if (this.sessionToken) {
      return `Bearer ${this.sessionToken}`;
    }
    return `Bearer ${this.apiKey}`;
  }

  private async requestWithRetry<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    retries: number = 0
  ): Promise<T> {
    try {
      const response = await this.client.request<T>({
        method,
        url,
        data,
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 429 && retries < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.requestWithRetry<T>(method, url, data, retries + 1);
      }

      throw error;
    }
  }

  async authLogin(email: string, password: string): Promise<NabdaAuthResponse> {
    try {
      const response = await this.requestWithRetry<NabdaAuthResponse>(
        'POST',
        '/api/v1/auth/login',
        { email, password }
      );

      if (response.success && response.token) {
        this.sessionToken = response.token;
      }

      return response;
    } catch (error: any) {
      console.error('Nabda auth login error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async selectInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.requestWithRetry<{ success: boolean }>(
        'POST',
        '/api/v1/auth/select-instance',
        { instanceId }
      );

      if (response.success) {
        this.currentInstanceId = instanceId;
      }

      return response;
    } catch (error: any) {
      console.error('Nabda select instance error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async selectBundle(bundleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.requestWithRetry<{ success: boolean }>(
        'POST',
        '/api/v1/auth/select-bundle',
        { bundleId }
      );

      if (response.success) {
        this.currentBundleId = bundleId;
      }

      return response;
    } catch (error: any) {
      console.error('Nabda select bundle error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async sendMessage(phone: string, message: string): Promise<NabdaMessageResponse> {
    try {
      const instanceId = this.currentInstanceId || process.env.NABDA_INSTANCE_ID;
      if (!instanceId) {
        throw new Error('No instance ID configured');
      }

      const response = await this.requestWithRetry<{ success: boolean; messageId?: string }>(
        'POST',
        `/api/v1/messages/send`,
        { phone, message, instanceId }
      );

      return {
        success: response.success,
        messageId: response.messageId,
      };
    } catch (error: any) {
      console.error('Nabda send message error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getInstanceStatus(): Promise<NabdaInstanceStatus | null> {
    try {
      const response = await this.requestWithRetry<NabdaInstanceStatus>(
        'GET',
        '/api/v1/instances/current'
      );
      return response;
    } catch (error: any) {
      console.error('Nabda get instance status error:', error.response?.data || error.message);
      return null;
    }
  }

  async getInstances(): Promise<NabdaInstance[]> {
    try {
      const response = await this.requestWithRetry<{ instances: NabdaInstance[] }>(
        'GET',
        '/api/v1/instances'
      );
      return response.instances || [];
    } catch (error: any) {
      console.error('Nabda get instances error:', error.response?.data || error.message);
      return [];
    }
  }

  async getBundles(): Promise<NabdaBundle[]> {
    try {
      const response = await this.requestWithRetry<{ bundles: NabdaBundle[] }>(
        'GET',
        '/api/v1/bundles'
      );
      return response.bundles || [];
    } catch (error: any) {
      console.error('Nabda get bundles error:', error.response?.data || error.message);
      return [];
    }
  }

  async getBalance(): Promise<NabdaBalanceResponse> {
    try {
      const response = await this.requestWithRetry<NabdaBalanceResponse>(
        'GET',
        '/api/v1/balance'
      );
      return response;
    } catch (error: any) {
      console.error('Nabda get balance error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  async getTemplates(): Promise<NabdaTemplate[]> {
    try {
      const response = await this.requestWithRetry<{ templates: NabdaTemplate[] }>(
        'GET',
        '/api/v1/templates/available'
      );
      return response.templates || [];
    } catch (error: any) {
      console.error('Nabda get templates error:', error.response?.data || error.message);
      return [];
    }
  }

  setSessionToken(token: string): void {
    this.sessionToken = token;
  }

  clearSession(): void {
    this.sessionToken = null;
  }

  setCurrentInstanceId(instanceId: string): void {
    this.currentInstanceId = instanceId;
  }

  setCurrentBundleId(bundleId: string): void {
    this.currentBundleId = bundleId;
  }

  isAuthenticated(): boolean {
    return !!this.sessionToken;
  }
}

export default NabdaClient;
