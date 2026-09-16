import { RiskForecastRequest, RiskEvidenceItem } from './risk.interface';

export interface ExtractedRiskFeatures {
  hasCriticalFinding: boolean;
  hasHighFinding: boolean;
  totalFindingsCount: number;
  categoryFindingCounts: Record<string, number>;
  categoryWeaknessMatches: Record<string, number>;
  matchedHistoricalRulesCount: number;
  evidence: RiskEvidenceItem[];
  isPersonalized: boolean;
}

export class RiskFeatureExtractor {
  static extractFeatures(request: RiskForecastRequest): ExtractedRiskFeatures {
    const evidence: RiskEvidenceItem[] = [];
    const categoryFindingCounts: Record<string, number> = {
      security: 0,
      performance: 0,
      correctness: 0,
      architecture: 0,
      maintainability: 0,
      style: 0,
    };

    let hasCriticalFinding = false;
    let hasHighFinding = false;

    // 1. Current static & AST findings evidence
    (request.findings || []).forEach((f) => {
      const cat = (f.category || 'correctness').toLowerCase();
      if (cat in categoryFindingCounts) {
        categoryFindingCounts[cat]++;
      }
      if (f.severity === 'critical') hasCriticalFinding = true;
      if (f.severity === 'high') hasHighFinding = true;

      evidence.push({
        type: 'current_finding',
        category: cat,
        description: `Current ${f.severity} issue: ${f.title}`,
        severity: f.severity,
      });
    });

    // 2. Matched historical rules evidence
    (request.historicalRules || []).forEach((hr) => {
      evidence.push({
        type: 'historical_rule',
        category: (hr.type || 'general').toLowerCase(),
        description: `Historical Policy #${hr.externalId || 'RULE'}: ${hr.description}`,
        ruleId: hr.ruleId,
      });
    });

    // 3. Developer Code DNA recurring weaknesses evidence
    const categoryWeaknessMatches: Record<string, number> = {
      security: 0,
      performance: 0,
      correctness: 0,
      architecture: 0,
      maintainability: 0,
      style: 0,
    };

    const dna = request.dna;
    const isPersonalized = Boolean(dna && dna.reviewCount >= 3);

    if (dna && dna.recurringWeaknesses && dna.recurringWeaknesses.length > 0) {
      dna.recurringWeaknesses.forEach((weakness) => {
        const weakCat = (weakness.category || 'correctness').toLowerCase();
        categoryWeaknessMatches[weakCat] += weakness.occurrenceCount || 2;
        evidence.push({
          type: 'developer_pattern',
          category: weakCat,
          description: `Recurring pattern "${weakness.title}" detected in ${weakness.occurrenceCount} previous reviews`,
        });
      });
    }

    return {
      hasCriticalFinding,
      hasHighFinding,
      totalFindingsCount: (request.findings || []).length,
      categoryFindingCounts,
      categoryWeaknessMatches,
      matchedHistoricalRulesCount: (request.historicalRules || []).length,
      evidence,
      isPersonalized,
    };
  }
}
