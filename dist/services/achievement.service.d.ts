import { IAchievement } from '../models';
export interface LevelInfo {
    level: number;
    levelTitle: string;
    targetXp: number;
    nextLevel: number;
}
export declare class AchievementService {
    /**
     * Deterministically calculates developer level and next XP target from current XP.
     * Never hardcodes Level 7.
     */
    static calculateLevel(xp: number): LevelInfo;
    /**
     * Calculates consecutive day improvement streak from actual review dates.
     * Never seeds a fake 18-day streak.
     */
    static calculateStreak(reviews: Array<{
        createdAt: Date;
    }>): number;
    /**
     * Evaluates badges strictly from actual review telemetry and metrics.
     * Only unlocks when conditions are genuinely met.
     */
    static evaluateBadges(reviews: Array<{
        createdAt: Date;
        qualityScore?: number;
        criticalCount?: number;
        warningCount?: number;
        metrics?: {
            security?: number;
            performance?: number;
        };
    }>): {
        id: string;
        title: string;
        subtitle: string;
        icon: string;
        isUnlocked: boolean;
        unlockedAt: string | undefined;
    }[];
    /**
     * Evaluates engineering milestones from genuine review history.
     */
    static evaluateMilestones(reviews: Array<{
        criticalCount?: number;
        warningCount?: number;
        qualityScore?: number;
    }>): {
        id: string;
        title: string;
        category: string;
        xpReward: string;
        completed: boolean;
        progress: string;
    }[];
    /**
     * Retrieves achievements. If none exist, initializes genuine 0-XP starting state.
     */
    static getAchievements(userId: string): Promise<IAchievement>;
    /**
     * Awards XP after a completed review and updates level, streak, and badges.
     * Review completed: +100 XP
     * Clean review: +50 bonus XP
     */
    static recordReviewCompletion(userId: string, reviewDoc: any): Promise<IAchievement>;
    /**
     * Recalculates achievements based on all real completed reviews for the user.
     */
    static recalculateUserAchievements(userId: string): Promise<IAchievement>;
}
