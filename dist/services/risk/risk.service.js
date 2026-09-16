"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskService = void 0;
const models_1 = require("../../models");
const analyzerRegistry_1 = require("../analysis/analyzerRegistry");
const historical_1 = require("../historical");
const dna_service_1 = require("../dna.service");
const riskCalculator_1 = require("./riskCalculator");
class RiskService {
    static async forecastRisk(userId, input) {
        const { language, fileName, sourceCode } = input;
        // 1. Static AST analysis
        const staticResult = await analyzerRegistry_1.AnalyzerRegistry.analyze(language, sourceCode, fileName);
        // 2. Retrieve Historical Engineering Rules
        const historicalResult = await historical_1.HistoricalRetriever.retrieveRelevantRules({
            code: sourceCode,
            language,
            limit: 3,
        });
        // 3. Retrieve Developer Code DNA
        const dna = await dna_service_1.DnaService.getDnaProfile(userId);
        // 4. Calculate Deterministic Risk
        const forecast = riskCalculator_1.RiskCalculator.calculateRisk({
            language,
            fileName,
            sourceCode,
            findings: staticResult.findings,
            historicalRules: historicalResult.matches,
            dna,
        });
        // 5. Update user's persistent RiskPrediction read-model
        const updatedPrediction = await models_1.RiskPrediction.findOneAndUpdate({ userId }, {
            $set: {
                repository: 'Workspace',
                prNumber: fileName,
                lastScanned: 'Just now',
                overallCategory: `${forecast.primaryCategory.toUpperCase()} RISK`,
                riskPercent: forecast.overallRiskPercent,
                riskLevel: forecast.overallRiskLevel === 'CRITICAL' ? 'HIGH' : forecast.overallRiskLevel,
                recommendation: forecast.recommendation,
                confidencePercent: forecast.confidencePercent,
                primaryFactors: forecast.primaryFactors,
                diagnosticReasoning: {
                    summary: forecast.summary,
                    affectedClass: fileName,
                    historicalEvidence: {
                        occurrences: forecast.evidence.filter((e) => e.type === 'developer_pattern').length,
                        sampleReviews: dna?.reviewCount || 0,
                        productionAlerts: forecast.overallRiskPercent > 70 ? 2 : 0,
                        timeframe: 'Last 30 days',
                    },
                    incidentTimeline: forecast.evidence.slice(0, 3).map((ev, idx) => ({
                        id: `ev-${idx + 1}`,
                        pr: ev.category ? ev.category.toUpperCase() : `FINDING-${idx + 1}`,
                        title: ev.description,
                        timeAgo: 'Detected pattern',
                        description: ev.description,
                        severity: ev.severity === 'critical' || ev.severity === 'high' ? 'red' : 'amber',
                    })),
                    targetFile: fileName,
                    targetLines: 'L1-L50',
                },
            },
        }, { upsert: true, new: true });
        return updatedPrediction;
    }
    static async getPredictiveRisk(userId) {
        return await models_1.RiskPrediction.findOne({ userId });
    }
}
exports.RiskService = RiskService;
//# sourceMappingURL=risk.service.js.map