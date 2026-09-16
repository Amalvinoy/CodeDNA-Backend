import { IReview } from '../../models';

export class ConsistencyAnalyzer {
  static calculateConsistency(reviews: IReview[]): number {
    if (!reviews || reviews.length <= 1) {
      return 90; // baseline consistency for single review
    }

    const scores = reviews.map((r) =>
      r.qualityScore <= 10 ? r.qualityScore * 10 : r.qualityScore
    );

    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // StdDev 0 => 100, StdDev 10 => 80, StdDev 25 => 50
    const consistency = Math.max(20, Math.min(100, Math.round(100 - stdDev * 2.0)));
    return consistency;
  }
}
