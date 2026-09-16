import mongoose, { Document, Schema } from 'mongoose';

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

const AchievementSchema = new Schema<IAchievement>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    level: { type: Number, default: 1 },
    levelTitle: { type: String, default: 'Junior Developer' },
    currentXp: { type: Number, default: 0 },
    targetXp: { type: Number, default: 1000 },
    improvementStreak: { type: Number, default: 0 },
    milestones: [
      {
        id: { type: String },
        title: { type: String },
        category: { type: String },
        xpReward: { type: String },
        completed: { type: Boolean },
        date: { type: String },
        progress: { type: String },
      },
    ],
    badges: [
      {
        id: { type: String },
        title: { type: String },
        subtitle: { type: String },
        icon: { type: String },
        isUnlocked: { type: Boolean },
        unlockedAt: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Achievement =
  mongoose.models.Achievement ||
  mongoose.model<IAchievement>('Achievement', AchievementSchema);
