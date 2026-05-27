import mongoose, { Schema, Document } from 'mongoose';
import { Campaign } from '../types';

interface CampaignDocument extends Campaign, Document {}

const CampaignSchema = new Schema<CampaignDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    templateId: {
      type: String,
      trim: true,
    },
    recipients: [{
      type: String,
      required: true,
    }],
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'completed', 'failed'],
      default: 'draft',
    },
    scheduledAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    stats: {
      total: {
        type: Number,
        default: 0,
      },
      sent: {
        type: Number,
        default: 0,
      },
      failed: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

CampaignSchema.index({ status: 1 });
CampaignSchema.index({ scheduledAt: 1 });
CampaignSchema.index({ createdAt: -1 });

export const CampaignModel = mongoose.model<CampaignDocument>('Campaign', CampaignSchema);
