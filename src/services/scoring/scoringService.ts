import { ICodeFinding, IReviewMetrics } from '../../models';

export interface QualityScoreCalculationResult {
  score: number;
  scoreDelta: number;
  metrics: IReviewMetrics;
  issuesCount: number;
  criticalCount: number;
  warningCount: number;
}

export class ScoringService {
  private static readonly BASE_SCORE = 10.0;

  static calculateQualityScore(
    findings: ICodeFinding[],
    baselineMetrics?: Partial<IReviewMetrics>
  ): QualityScoreCalculationResult {
    let score = this.BASE_SCORE;

    let criticalCount = 0;
    let warningCount = 0;

    const metricDeltas = {
      correctness: 0,
      security: 0,
      performance: 0,
      architecture: 0,
      maintainability: 0,
    };

    findings.forEach((finding) => {
      let penalty = 0;
      const confidenceWeight = Math.max(0.5, Math.min(1.0, finding.confidence || 0.9));

      switch (finding.severity) {
        case 'critical':
          penalty = 2.0 * confidenceWeight;
          criticalCount++;
          break;
        case 'high':
          penalty = 1.2 * confidenceWeight;
          warningCount++;
          break;
        case 'medium':
          penalty = 0.6 * confidenceWeight;
          warningCount++;
          break;
        case 'low':
        case 'style' as any:
          penalty = 0.25 * confidenceWeight;
          break;
        case 'info':
          penalty = 0.1 * confidenceWeight;
          break;
        default:
          penalty = 0.2 * confidenceWeight;
      }

      score -= penalty;

      // Deduct from specific category metric
      const category = finding.category;
      if (category in metricDeltas) {
        metricDeltas[category as keyof typeof metricDeltas] += penalty * 1.2;
      }
    });

    // Ensure score within [1.0, 10.0]
    const finalScore = Math.max(1.0, Math.min(10.0, Math.round(score * 10) / 10));

    // Calculate sub-metrics
    const metrics: IReviewMetrics = {
      correctness: Math.max(
        1.0,
        Math.min(10.0, Math.round(((baselineMetrics?.correctness ?? 9.5) - metricDeltas.correctness) * 10) / 10)
      ),
      security: Math.max(
        1.0,
        Math.min(10.0, Math.round(((baselineMetrics?.security ?? 9.5) - metricDeltas.security) * 10) / 10)
      ),
      performance: Math.max(
        1.0,
        Math.min(10.0, Math.round(((baselineMetrics?.performance ?? 9.0) - metricDeltas.performance) * 10) / 10)
      ),
      architecture: Math.max(
        1.0,
        Math.min(10.0, Math.round(((baselineMetrics?.architecture ?? 9.0) - metricDeltas.architecture) * 10) / 10)
      ),
      maintainability: Math.max(
        1.0,
        Math.min(10.0, Math.round(((baselineMetrics?.maintainability ?? 9.0) - metricDeltas.maintainability) * 10) / 10)
      ),
    };

    // Calculate score delta from average 7.5 baseline
    const scoreDelta = Math.round((finalScore - 7.5) * 10) / 10;

    return {
      score: finalScore,
      scoreDelta,
      metrics,
      issuesCount: findings.length,
      criticalCount,
      warningCount,
    };
  }
}
