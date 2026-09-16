import { IReview, IDnaTrend } from '../../models';

export interface TrendAnalysisResult {
  trends: IDnaTrend[];
  evolutionTrajectory: { month: string; score: number }[];
  improvementMonthPercent: number;
}

export class TrendAnalyzer {
  static analyzeTrends(reviews: IReview[]): TrendAnalysisResult {
    if (!reviews || reviews.length === 0) {
      return {
        trends: [],
        evolutionTrajectory: [],
        improvementMonthPercent: 0,
      };
    }

    // Sort chronologically (oldest to newest)
    const sorted = [...reviews].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const categories = ['correctness', 'security', 'performance', 'architecture', 'maintainability'];
    const trends: IDnaTrend[] = [];

    // Split into earlier half vs recent half if >= 2 reviews
    const mid = Math.max(1, Math.floor(sorted.length / 2));
    const earlierReviews = sorted.slice(0, mid);
    const recentReviews = sorted.slice(mid);

    categories.forEach((cat) => {
      const earlierAvg =
        earlierReviews.reduce((sum, r) => sum + ((r.metrics as any)?.[cat] ?? 8.0), 0) /
        earlierReviews.length;

      const recentAvg =
        recentReviews.length > 0
          ? recentReviews.reduce((sum, r) => sum + ((r.metrics as any)?.[cat] ?? 8.0), 0) /
            recentReviews.length
          : earlierAvg;

      const delta = Math.round((recentAvg - earlierAvg) * 10) / 10;
      let direction: 'improving' | 'declining' | 'stable' = 'stable';

      if (delta >= 0.5) {
        direction = 'improving';
      } else if (delta <= -0.5) {
        direction = 'declining';
      }

      trends.push({
        category: cat.toUpperCase(),
        direction,
        delta,
        currentScore: Math.round(recentAvg * 10) / 10,
        previousScore: Math.round(earlierAvg * 10) / 10,
      });
    });

    // Evolution Trajectory
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trajectoryMap = new Map<string, { sum: number; count: number }>();

    sorted.forEach((r) => {
      const d = new Date(r.createdAt || Date.now());
      const monthLabel = months[d.getMonth()];
      const item = trajectoryMap.get(monthLabel) || { sum: 0, count: 0 };
      item.sum += (r.qualityScore <= 10 ? r.qualityScore * 10 : r.qualityScore);
      item.count++;
      trajectoryMap.set(monthLabel, item);
    });

    let evolutionTrajectory = Array.from(trajectoryMap.entries()).map(([month, data]) => ({
      month,
      score: Math.round(data.sum / data.count),
    }));

    if (evolutionTrajectory.length === 0) {
      evolutionTrajectory = [
        { month: 'Current', score: Math.round((sorted[sorted.length - 1]?.qualityScore || 8) * 10) },
      ];
    }

    // Improvement month percent
    let improvementMonthPercent = 0;
    if (sorted.length >= 2) {
      const firstScore = sorted[0].qualityScore <= 10 ? sorted[0].qualityScore * 10 : sorted[0].qualityScore;
      const latestScore = sorted[sorted.length - 1].qualityScore <= 10 ? sorted[sorted.length - 1].qualityScore * 10 : sorted[sorted.length - 1].qualityScore;
      improvementMonthPercent = Math.round(((latestScore - firstScore) / Math.max(1, firstScore)) * 100);
    }

    return {
      trends,
      evolutionTrajectory,
      improvementMonthPercent,
    };
  }
}
