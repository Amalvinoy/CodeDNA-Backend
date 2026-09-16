import {
  RiskForecastRequest,
  RiskForecastResult,
  CategoryRiskScore,
} from './risk.interface';
import { RiskFeatureExtractor } from './riskFeatureExtractor';

export class RiskCalculator {
  static calculateRisk(request: RiskForecastRequest): RiskForecastResult {
    const features = RiskFeatureExtractor.extractFeatures(request);
    const categories = ['security', 'performance', 'correctness', 'architecture', 'maintainability'] as const;

    const categoryRisks: CategoryRiskScore[] = [];
    let highestRiskScore = 0;
    let highestRiskCategory = 'performance';

    categories.forEach((cat) => {
      let riskScore = 15; // baseline clean risk

      // Finding severity additions
      const findingCount = features.categoryFindingCounts[cat] || 0;
      if (findingCount > 0) {
        const catFindings = (request.findings || []).filter(
          (f) => (f.category || '').toLowerCase() === cat
        );
        catFindings.forEach((f) => {
          if (f.severity === 'critical') riskScore += 45;
          else if (f.severity === 'high') riskScore += 25;
          else if (f.severity === 'medium') riskScore += 15;
          else riskScore += 5;
        });
      }

      // Developer Code DNA recurring weakness amplification
      const weaknessOccurrences = features.categoryWeaknessMatches[cat] || 0;
      if (weaknessOccurrences > 0) {
        riskScore += Math.min(30, weaknessOccurrences * 8);
      }

      // Historical rule match amplification
      const hasHistoricalRule = (request.historicalRules || []).some(
        (hr) => (hr.type || '').toLowerCase() === cat
      );
      if (hasHistoricalRule && findingCount > 0) {
        riskScore += 10;
      }

      // Clamp risk score to [0, 100]
      riskScore = Math.min(100, Math.max(5, riskScore));

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (riskScore >= 85) riskLevel = 'CRITICAL';
      else if (riskScore >= 65) riskLevel = 'HIGH';
      else if (riskScore >= 35) riskLevel = 'MEDIUM';

      const catEvidence = features.evidence.filter((e) => e.category === cat);

      categoryRisks.push({
        category: cat,
        riskScore,
        riskLevel,
        evidence: catEvidence,
      });

      if (riskScore > highestRiskScore) {
        highestRiskScore = riskScore;
        highestRiskCategory = cat;
      }
    });

    const overallRiskPercent = Math.max(10, highestRiskScore);
    let overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (overallRiskPercent >= 85) overallRiskLevel = 'CRITICAL';
    else if (overallRiskPercent >= 65) overallRiskLevel = 'HIGH';
    else if (overallRiskPercent >= 35) overallRiskLevel = 'MEDIUM';

    // Confidence Calculation aware of historical data size
    let confidencePercent = 60;
    if (features.isPersonalized) {
      confidencePercent = Math.min(96, 80 + features.evidence.length * 3);
    } else {
      confidencePercent = Math.min(65, 50 + (features.totalFindingsCount > 0 ? 10 : 0));
    }

    const personalization = features.isPersonalized ? 'personalized' : 'insufficient_history';

    // Primary factors
    const primaryFactors = [
      {
        id: 'f-1',
        label: `${highestRiskCategory.toUpperCase()} Vulnerability Surface`,
        impactPercent: Math.min(95, overallRiskPercent + 5),
        color: overallRiskLevel === 'HIGH' || overallRiskLevel === 'CRITICAL' ? ('red' as const) : ('amber' as const),
      },
      {
        id: 'f-2',
        label: 'Developer Recurrence Tendency',
        impactPercent: features.isPersonalized ? 65 : 30,
        color: 'amber' as const,
      },
      {
        id: 'f-3',
        label: 'Historical Engineering Rule Alignment',
        impactPercent: features.matchedHistoricalRulesCount > 0 ? 80 : 40,
        color: 'cyan' as const,
      },
    ];

    let recommendation = '';
    if (overallRiskLevel === 'CRITICAL' || overallRiskLevel === 'HIGH') {
      recommendation = `Immediate refactoring required in ${highestRiskCategory.toUpperCase()}. Apply parameterized/safe patterns before merge to prevent production incidents.`;
    } else if (overallRiskLevel === 'MEDIUM') {
      recommendation = `Moderate risk identified. Review recommended optimizations for ${highestRiskCategory.toUpperCase()} to maintain architectural standards.`;
    } else {
      recommendation = 'Clean pass. Code exhibits low risk profile and adheres to established engineering best practices.';
    }

    const summary = `${overallRiskLevel} risk forecast for ${request.fileName} (${request.language.toUpperCase()}). ${
      features.isPersonalized
        ? `Synthesized from developer Code DNA with ${features.evidence.length} ground evidence points.`
        : 'Generic risk assessment based on static analysis and engineering memory policies.'
    }`;

    return {
      overallRiskLevel,
      overallRiskPercent,
      confidencePercent,
      personalization,
      primaryCategory: highestRiskCategory,
      recommendation,
      summary,
      categoryRisks,
      primaryFactors,
      evidence: features.evidence,
    };
  }
}
