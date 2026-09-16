import { CodeDNA, ICodeDNA, Review, IReview } from '../models';
import { DnaCalculator } from './dna/dnaCalculator';

export class DnaService {
  static async getDnaProfile(userId: string): Promise<ICodeDNA> {
    let profile = await CodeDNA.findOne({ userId });

    if (!profile) {
      profile = await this.calculateAndSaveDNA(userId);
    }

    return profile;
  }

  static async calculateAndSaveDNA(userId: string): Promise<ICodeDNA> {
    // 1. Fetch all completed reviews for user
    const reviews: IReview[] = await Review.find({ userId, status: 'completed' })
      .sort({ createdAt: 1 })
      .select('-sourceCode'); // Exclude heavy source code strings for performance

    // 2. Compute updated profile
    const profileData = DnaCalculator.calculateProfile(userId, reviews);

    // 3. Upsert into MongoDB
    const updated = await CodeDNA.findOneAndUpdate(
      { userId },
      { $set: profileData },
      { upsert: true, new: true }
    );

    return updated;
  }

  static async getDnaSummary(userId: string): Promise<{
    overallScore: number;
    level: number;
    levelTitle: string;
    reviewCount: number;
    consistencyScore: number;
    strengthsCount: number;
    weaknessesCount: number;
    improvementMonthPercent: number;
  }> {
    const profile = await this.getDnaProfile(userId);
    return {
      overallScore: profile.overallScore,
      level: profile.level,
      levelTitle: profile.levelTitle,
      reviewCount: profile.reviewCount,
      consistencyScore: profile.consistencyScore,
      strengthsCount: profile.strengths?.length || 0,
      weaknessesCount: profile.recurringWeaknesses?.length || 0,
      improvementMonthPercent: profile.improvementMonthPercent || 0,
    };
  }

  static async getDnaPatterns(userId: string) {
    const profile = await this.getDnaProfile(userId);
    return {
      patterns: profile.patterns || [],
      recurringWeaknesses: profile.recurringWeaknesses || [],
      patternHistory: profile.patternHistory || [],
    };
  }

  static async getDnaTrends(userId: string) {
    const profile = await this.getDnaProfile(userId);
    return {
      trends: profile.trends || [],
      evolutionTrajectory: profile.evolutionTrajectory || [],
      improvementMonthPercent: profile.improvementMonthPercent || 0,
    };
  }

  static async rebuildCodeDNA(userId: string): Promise<ICodeDNA> {
    return await this.calculateAndSaveDNA(userId);
  }
}
