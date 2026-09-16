import { IReview, IDnaStrength } from '../../models';

export class StrengthAnalyzer {
  private static readonly STRENGTH_THRESHOLD = 8.8;

  static analyzeStrengths(
    reviews: IReview[],
    categoryScores: Record<string, number>
  ): IDnaStrength[] {
    if (!reviews || reviews.length === 0) return [];

    const strengths: IDnaStrength[] = [];

    // Category strength definitions
    const categoryMetadata: Record<string, { title: string; description: string; color: 'green' | 'blue' }> = {
      security: {
        title: 'Zero Security Vulnerabilities',
        description: 'Consistently implements secure data handling, input sanitization, and authorization safeguards.',
        color: 'green',
      },
      correctness: {
        title: 'High Algorithmic Robustness',
        description: 'Demonstrates resilient error propagation, edge case validation, and type safety across logic boundaries.',
        color: 'blue',
      },
      performance: {
        title: 'Optimized Resource Execution',
        description: 'Avoids costly redundant database queries and memory allocation overhead in high-throughput paths.',
        color: 'green',
      },
      architecture: {
        title: 'Clean Modular Separation',
        description: 'Maintains clear separation of concerns, decoupling controllers from domain logic.',
        color: 'blue',
      },
      maintainability: {
        title: 'High Code Maintainability',
        description: 'Writes readable, idiomatic code with clear function contracts and robust typing.',
        color: 'green',
      },
    };

    Object.entries(categoryScores).forEach(([cat, score]) => {
      const meta = categoryMetadata[cat];
      if (meta && score >= this.STRENGTH_THRESHOLD) {
        // Calculate percentile based on score
        const percentileNum = Math.min(99, Math.round(score * 10.2));
        strengths.push({
          id: `str-${cat}`,
          category: cat,
          title: meta.title,
          percentile: `Top ${Math.max(1, 100 - percentileNum)}% (${percentileNum}th)`,
          description: meta.description,
          score,
          confidence: 0.95,
          color: meta.color,
        });
      }
    });

    // If no single category crosses threshold, but overall review quality is solid
    if (strengths.length === 0 && reviews.length > 0) {
      const avgScore = reviews.reduce((sum, r) => sum + (r.qualityScore || 8), 0) / reviews.length;
      if (avgScore >= 8.0) {
        strengths.push({
          id: 'str-general',
          category: 'general',
          title: 'Reliable Code Hygiene',
          percentile: 'Top 25% (75th)',
          description: 'Follows established coding conventions and maintains steady baseline code quality.',
          score: Math.round(avgScore * 10) / 10,
          confidence: 0.85,
          color: 'green',
        });
      }
    }

    return strengths;
  }
}
