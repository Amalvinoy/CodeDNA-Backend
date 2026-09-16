import mongoose, { Document } from 'mongoose';
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
export declare const User: mongoose.Model<any, {}, {}, {}, any, any>;
