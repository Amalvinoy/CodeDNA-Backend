import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: 'user' | 'admin';
  primaryRole?: string;
  engineeringFocus?: string;
  preferences?: {
    strictMode: boolean;
    autoFix: boolean;
    predictiveAlerts: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name must be under 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    primaryRole: {
      type: String,
      default: 'Fullstack Developer',
      trim: true,
      maxlength: [100, 'Primary role must be under 100 characters'],
    },
    engineeringFocus: {
      type: String,
      default: 'TypeScript, Node.js',
      trim: true,
      maxlength: [200, 'Engineering focus must be under 200 characters'],
    },
    preferences: {
      strictMode: { type: Boolean, default: true },
      autoFix: { type: Boolean, default: true },
      predictiveAlerts: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Method to return safe sanitized user object
UserSchema.methods.toJSON = function () {
  const userObj = this.toObject();
  delete userObj.passwordHash;
  delete userObj.__v;
  return userObj;
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
