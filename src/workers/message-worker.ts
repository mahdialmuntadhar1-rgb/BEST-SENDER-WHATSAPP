import type { QueueMessageBatch } from 'cloudflare:workers';

export interface MessageJob {
  type: 'send_message' | 'send_otp';
  recipient: string;
  message: string;
  campaignId?: string;
  contactId?: string;
  instanceId?: string;
  retryCount?: number;
}

export default {
  async queue(batch: QueueMessageBatch<MessageJob>, env: any): Promise<void> {
    for (const message of batch.messages) {
      const { body, id } = message;

      try {
        if (body.type === 'send_message') {
          await sendWhatsAppMessage(body, env);
        } else if (body.type === 'send_otp') {
          await sendOTP(body, env);
        }

        message.ack();
      } catch (error: any) {
        console.error('Failed to process message:', error);

        // Retry logic
        const retryCount = body.retryCount || 0;
        if (retryCount < 3) {
          // Retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          message.retry({
            body: { ...body, retryCount: retryCount + 1 },
          });
        } else {
          // Max retries reached, mark as failed
          message.ack();
          // TODO: Update message log as failed
        }
      }
    }
  },
};

async function sendWhatsAppMessage(job: MessageJob, env: any): Promise<void> {
  const response = await fetch(`${env.NABDA_API_BASE_URL}/api/v1/messages/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.NABDA_API_KEY}`,
    },
    body: JSON.stringify({
      phone: job.recipient,
      message: job.message,
      instanceId: job.instanceId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  const data = await response.json();
  
  // TODO: Update message log with success status and nabda_message_id
  // TODO: Update campaign stats
}

async function sendOTP(job: MessageJob, env: any): Promise<void> {
  const response = await fetch(`${env.NABDA_API_BASE_URL}/api/v1/otp/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.NABDA_API_KEY}`,
    },
    body: JSON.stringify({
      phone: job.recipient,
      purpose: job.message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send OTP: ${response.statusText}`);
  }

  const data = await response.json();
  
  // TODO: Update message log with success status
}
