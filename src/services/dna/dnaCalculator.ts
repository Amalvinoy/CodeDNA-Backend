import { IReview, ICodeDNA } from '../../models';
import { StrengthAnalyzer } from './strengthAnalyzer';
import { WeaknessAnalyzer } from './weaknessAnalyzer';
import { TrendAnalyzer } from './trendAnalyzer';
import { ConsistencyAnalyzer } from './consistencyAnalyzer';

export class DnaCalculator {
  static calculateProfile(userId: string, reviews: IReview[]): Partial<ICodeDNA> {
    if (!reviews || reviews.length === 0) {
      return {
        userId,
        overallScore: 0,
        maxScore: 100,
        consistencyScore: 0,
        improvementMonthPercent: 0,
        level: 1,
        levelTitle: 'NEW ENGINEER',
        progressToNextLevel: 0,
        attributes: {
          security: 0,
          correctness: 0,
          maintainability: 0,
          architecture: 0,
          performance: 0,
        },
        categoryScores: {
          correctness: 0,
          security: 0,
          performance: 0,
          architecture: 0,
          maintainability: 0,
          style: 0,
        },
        metrics: {
          codeComplexity: 0,
          testCoverage: 0,
          modularity: 0,
          recurringBugFrequency: 0,
          codeEfficiency: 0,
        },
        strengths: [],
        areasForOptimization: [],
        recurringWeaknesses: [],
        patterns: [],
        trends: [],
        evolutionTrajectory: [],
        patternHistory: [],
        languages: [],
        reviewCount: 0,
        lastCalculatedAt: new Date(),
        version: 1,
      };
    }

    // Sort chronologically (oldest to newest)
    const sorted = [...reviews].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // 1. Recency-Weighted Category Scoring
    // Weights: 1.0, 1.2, 1.4, ... up to 2.5 for most recent
    const categories = ['correctness', 'security', 'performance', 'architecture', 'maintainability', 'style'] as const;
    const categoryScores: Record<string, number> = {};

    categories.forEach((cat) => {
      let weightedSum = 0;
      let totalWeight = 0;

      sorted.forEach((r, idx) => {
        const weight = 1 + (idx / Math.max(1, sorted.length - 1)) * 1.5;
        const val = (r.metrics as any)?.[cat] ?? (r.qualityScore || 8.0);
        weightedSum += val * weight;
        totalWeight += weight;
      });

      categoryScores[cat] = Math.round((weightedSum / Math.max(1, totalWeight)) * 10) / 10;
    });

    // 2. Normalized Overall Score (0-100 scale)
    const overallCategoryAvg =
      (categoryScores.correctness * 0.25 +
        categoryScores.security * 0.25 +
        categoryScores.performance * 0.2 +
        categoryScores.architecture * 0.15 +
        categoryScores.maintainability * 0.15);

    const overallScore = Math.min(100, Math.max(10, Math.round(overallCategoryAvg * 10)));

    // 3. Consistency Score
    const consistencyScore = ConsistencyAnalyzer.calculateConsistency(sorted);

    // 4. Strengths
    const strengths = StrengthAnalyzer.analyzeStrengths(sorted, categoryScores);

    // 5. Patterns and Recurring Weaknesses
    const { allPatterns, recurringWeaknesses, areasForOptimization, patternHistory } =
      WeaknessAnalyzer.analyzePatternsAndWeaknesses(sorted);

    // 6. Trends and Trajectory
    const { trends, evolutionTrajectory, improvementMonthPercent } =
      TrendAnalyzer.analyzeTrends(sorted);

    // 7. Developer Level & Title Calculation
    const reviewCount = sorted.length;
    let level = 1;
    let levelTitle = 'JUNIOR DEVELOPER';

    if (reviewCount >= 20 && overallScore >= 90) {
      level = 10;
      levelTitle = 'DISTINGUISHED ARCHITECT';
    } else if (reviewCount >= 15 && overallScore >= 85) {
      level = 8;
      levelTitle = 'PRINCIPAL ENGINEER';
    } else if (reviewCount >= 10 && overallScore >= 80) {
      level = 7;
      levelTitle = 'CODE ARCHITECT';
    } else if (reviewCount >= 5 && overallScore >= 75) {
      level = 5;
      levelTitle = 'SENIOR DEVELOPER';
    } else if (reviewCount >= 3) {
      level = 3;
      levelTitle = 'MID-LEVEL ENGINEER';
    } else {
      level = 2;
      levelTitle = 'JUNIOR DEVELOPER';
    }

    const progressToNextLevel = Math.min(95, Math.round((reviewCount % 5) * 20 + 20));

    // 8. Attributes on 0-100 scale
    const attributes = {
      security: Math.round((categoryScores.security || 8.0) * 10),
      correctness: Math.round((categoryScores.correctness || 8.0) * 10),
      maintainability: Math.round((categoryScores.maintainability || 8.0) * 10),
      architecture: Math.round((categoryScores.architecture || 8.0) * 10),
      performance: Math.round((categoryScores.performance || 8.0) * 10),
    };

    // 9. Metrics
    const metrics = {
      codeComplexity: Math.max(30, Math.min(95, Math.round(100 - categoryScores.maintainability * 3.5))),
      testCoverage: Math.max(40, Math.min(98, Math.round(categoryScores.correctness * 9.5))),
      modularity: Math.max(40, Math.min(98, Math.round(categoryScores.architecture * 10.5))),
      recurringBugFrequency: recurringWeaknesses.length * 4,
      codeEfficiency: Math.max(50, Math.min(99, Math.round(categoryScores.performance * 10.5))),
    };

    // 10. Language Distribution from actual completed reviews
    const languageCounts: Record<string, number> = {};
    let totalCompletedWithLang = 0;
    sorted.forEach((r) => {
      if (r.language) {
        const raw = r.language.trim().toLowerCase();
        const displayLang =
          raw === 'typescript' || raw === 'ts'
            ? 'TypeScript'
            : raw === 'javascript' || raw === 'js'
            ? 'JavaScript'
            : raw === 'python' || raw === 'py'
            ? 'Python'
            : raw === 'go' || raw === 'golang'
            ? 'Go'
            : raw === 'java'
            ? 'Java'
            : raw === 'rust'
            ? 'Rust'
            : raw.charAt(0).toUpperCase() + raw.slice(1);
        languageCounts[displayLang] = (languageCounts[displayLang] || 0) + 1;
        totalCompletedWithLang++;
      }
    });

    const languages = Object.entries(languageCounts)
      .map(([language, count]) => ({
        language,
        percentage: Math.round((count / Math.max(1, totalCompletedWithLang)) * 100),
        count,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      userId,
      overallScore,
      maxScore: 100,
      consistencyScore,
      improvementMonthPercent,
      level,
      levelTitle,
      progressToNextLevel,
      attributes,
      categoryScores: {
        correctness: categoryScores.correctness,
        security: categoryScores.security,
        performance: categoryScores.performance,
        architecture: categoryScores.architecture,
        maintainability: categoryScores.maintainability,
        style: categoryScores.style || 8.0,
      },
      metrics,
      strengths,
      areasForOptimization,
      recurringWeaknesses,
      patterns: allPatterns,
      trends,
      evolutionTrajectory,
      patternHistory,
      languages,
      reviewCount,
      lastCalculatedAt: new Date(),
      version: 2,
    };
  }
}
