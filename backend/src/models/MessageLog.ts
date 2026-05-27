import mongoose, { Schema, Document } from 'mongoose';
import { MessageLog } from '../types';

interface MessageLogDocument extends MessageLog, Document {}

const MessageLogSchema = new Schema<MessageLogDocument>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending',
    },
    nabdaMessageId: {
      type: String,
      trim: true,
    },
    error: {
      type: String,
      trim: true,
    },
    sentAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

MessageLogSchema.index({ campaignId: 1 });
MessageLogSchema.index({ recipient: 1 });
MessageLogSchema.index({ status: 1 });
MessageLogSchema.index({ createdAt: -1 });

export const MessageLogModel = mongoose.model<MessageLogDocument>('MessageLog', MessageLogSchema);
