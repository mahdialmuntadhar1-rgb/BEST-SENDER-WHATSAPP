import mongoose, { Schema, Document } from 'mongoose';

interface UserDocument extends Document {
  email: string;
  passwordHash?: string;
  nabdaApiKey: string;
  nabdaInstanceId?: string;
  nabdaBundleId?: string;
  nabdaSessionToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      trim: true,
    },
    nabdaApiKey: {
      type: String,
      required: true,
      trim: true,
    },
    nabdaInstanceId: {
      type: String,
      trim: true,
    },
    nabdaBundleId: {
      type: String,
      trim: true,
    },
    nabdaSessionToken: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 });
UserSchema.index({ nabdaInstanceId: 1 });

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
