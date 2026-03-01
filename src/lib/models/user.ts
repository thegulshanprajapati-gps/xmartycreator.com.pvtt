import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  mobile: string;
  deviceTokenHash: string | null;
  fingerprintHash: string | null;
  deviceBoundAt: Date | null;
  lastLoginAt: Date | null;
  failedLoginAttempts: number;
  lastFailedLoginAt: Date | null;
  isSuspended: boolean;
  suspendedAt: Date | null;
  suspendedBy: string | null;
  suspensionReason: string | null;
  termsAccepted: boolean;
  termsAcceptedAt: Date | null;
  termsVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (value: string) => /^\d{10}$/.test(value),
        message: 'Mobile must be exactly 10 digits',
      },
    },
    deviceTokenHash: {
      type: String,
      default: null,
      trim: true,
    },
    fingerprintHash: {
      type: String,
      default: null,
      trim: true,
    },
    deviceBoundAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastFailedLoginAt: {
      type: Date,
      default: null,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendedBy: {
      type: String,
      default: null,
      trim: true,
    },
    suspensionReason: {
      type: String,
      default: null,
      trim: true,
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    termsVersion: {
      type: String,
      default: 'v1',
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
