import mongoose, { Schema, Document } from 'mongoose';

export type Language = 'arabic' | 'sorani' | 'bahdini';

export type Governorate =
  | 'Baghdad'
  | 'Basra'
  | 'Erbil'
  | 'Duhok'
  | 'Zakho'
  | 'Sulaymaniyah'
  | 'Najaf'
  | 'Karbala'
  | 'Mosul'
  | 'Kirkuk'
  | 'Anbar'
  | 'Diyala'
  | 'Wasit'
  | 'Maysan'
  | 'Dhi Qar'
  | 'Babil'
  | 'Qadisiyah'
  | 'Muthanna'
  | 'Salah ad Din'
  | 'Halabja';

interface ContactDocument extends Document {
  name: string;
  phone: string;
  email?: string;
  category?: string;
  governorate?: Governorate;
  language?: Language;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<ContactDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      trim: true,
    },
    governorate: {
      type: String,
      enum: [
        'Baghdad',
        'Basra',
        'Erbil',
        'Duhok',
        'Zakho',
        'Sulaymaniyah',
        'Najaf',
        'Karbala',
        'Mosul',
        'Kirkuk',
        'Anbar',
        'Diyala',
        'Wasit',
        'Maysan',
        'Dhi Qar',
        'Babil',
        'Qadisiyah',
        'Muthanna',
        'Salah ad Din',
        'Halabja',
      ],
      trim: true,
    },
    language: {
      type: String,
      enum: ['arabic', 'sorani', 'bahdini'],
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

ContactSchema.index({ phone: 1, governorate: 1 }, { unique: true });
ContactSchema.index({ phone: 1 });
ContactSchema.index({ category: 1 });
ContactSchema.index({ governorate: 1 });
ContactSchema.index({ language: 1 });
ContactSchema.index({ tags: 1 });

export const ContactModel = mongoose.model<ContactDocument>('Contact', ContactSchema);
