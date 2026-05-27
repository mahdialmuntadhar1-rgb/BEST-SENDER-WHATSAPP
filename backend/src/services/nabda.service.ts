import axios from 'axios';
import { NabdaMessageResponse, NabdaBalanceResponse, NabdaTemplate } from '../types';

const NABDA_API_BASE_URL = process.env.NABDA_API_BASE_URL || 'https://api.nabdaotp.com';
const NABDA_API_KEY = process.env.NABDA_API_KEY || '';
const NABDA_INSTANCE_ID = process.env.NABDA_INSTANCE_ID || '';

const nabdaApi = axios.create({
  baseURL: NABDA_API_BASE_URL,
  headers: {
    'X-API-KEY': NABDA_API_KEY,
    'Content-Type': 'application/json',
  },
});

export class NabdaService {
  static async sendMessage(to: string, message: string): Promise<NabdaMessageResponse> {
    try {
      const response = await nabdaApi.post(`/inst/${NABDA_INSTANCE_ID}/messages`, {
        to,
        messaging_product: 'whatsapp',
        type: 'text',
        text: { body: message },
      });

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id,
      };
    } catch (error: any) {
      console.error('Nabda API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  static async sendOTP(to: string, purpose: string, templateName?: string): Promise<NabdaMessageResponse> {
    try {
      const response = await nabdaApi.post(`/inst/${NABDA_INSTANCE_ID}/otp/send`, {
        to,
        purpose,
        ttlSeconds: 300,
        templateName: templateName || 'auth_otp_basic',
      });

      return {
        success: true,
        messageId: response.data?.messageId,
      };
    } catch (error: any) {
      console.error('Nabda OTP error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  static async getBalance(): Promise<NabdaBalanceResponse> {
    try {
      const response = await nabdaApi.get('/balance');
      return response.data;
    } catch (error: any) {
      console.error('Nabda balance error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  static async getTemplates(): Promise<NabdaTemplate[]> {
    try {
      const response = await nabdaApi.get('/templates/available');
      return response.data?.templates || [];
    } catch (error: any) {
      console.error('Nabda templates error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  static async sendBulkMessages(
    recipients: string[],
    message: string,
    delayMs: number = 500
  ): Promise<NabdaMessageResponse[]> {
    const results: NabdaMessageResponse[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const result = await this.sendMessage(recipients[i], message);
      results.push(result);

      if (delayMs > 0 && i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}
