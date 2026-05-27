import mongoose, { Schema, Document } from 'mongoose';
import { Template } from '../types';

interface TemplateDocument extends Template, Document {}

const TemplateSchema = new Schema<TemplateDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    variables: [{
      type: String,
      trim: true,
    }],
    category: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

TemplateSchema.index({ name: 1 });
TemplateSchema.index({ category: 1 });
TemplateSchema.index({ isActive: 1 });

export const TemplateModel = mongoose.model<TemplateDocument>('Template', TemplateSchema);
