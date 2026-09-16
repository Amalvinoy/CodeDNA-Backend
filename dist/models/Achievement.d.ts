import mongoose, { Document } from 'mongoose';
export interface IAchievement extends Document {
    userId: string;
    level: number;
    levelTitle: string;
    currentXp: number;
    targetXp: number;
    improvementStreak: number;
    milestones: {
        id: string;
        title: string;
        category: string;
        xpReward: string;
        completed: boolean;
        date?: string;
        progress?: string;
    }[];
    badges: {
        id: string;
        title: string;
        subtitle: string;
        icon: string;
        isUnlocked: boolean;
        unlockedAt?: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Achievement: mongoose.Model<any, {}, {}, {}, any, any>;
