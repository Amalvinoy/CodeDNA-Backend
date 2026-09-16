"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const analysis_1 = require("./analysis");
const historicalHook_1 = require("./historical/historicalHook");
const ai_1 = require("./ai");
const scoringService_1 = require("./scoring/scoringService");
class ReviewService {
    static MAX_CODE_SIZE_BYTES = 500 * 1024; // 500 KB
    static async submitReview(userId, input) {
        const startTime = Date.now();
        // 1. Validate Source Code
        if (!input.sourceCode || typeof input.sourceCode !== 'string' || !input.sourceCode.trim()) {
            const err = new Error('Source code cannot be empty.');
            err.statusCode = 400;
            throw err;
        }
        const codeBytes = Buffer.byteLength(input.sourceCode, 'utf8');
        if (codeBytes > this.MAX_CODE_SIZE_BYTES) {
            const err = new Error(`Source code size (${Math.round(codeBytes / 1024)}KB) exceeds maximum allowable limit (500KB).`);
            err.statusCode = 400;
            throw err;
        }
        // 2. Normalize and Validate Language
        const normalizedLang = analysis_1.LanguageDetector.normalizeLanguage(input.language);
        if (!normalizedLang) {
            const err = new Error(`Unsupported programming language "${input.language}". Supported: ${analysis_1.LanguageDetector.getSupportedLanguagesList().join(', ')}.`);
            err.statusCode = 400;
            throw err;
        }
        // Validate language against code syntax
        const langValidation = analysis_1.LanguageDetector.validateLanguageWithCode(normalizedLang, input.sourceCode);
        if (!langValidation.isValid) {
            const selectedDisplay = analysis_1.LanguageDetector.getDisplayName(normalizedLang);
            const detectedMsg = langValidation.suggestedLanguage
                ? ` Detected: ${analysis_1.LanguageDetector.getDisplayName(langValidation.suggestedLanguage)}.`
                : '';
            const err = new Error(langValidation.warning ||
                `Selected language does not match the submitted source code. Selected: ${selectedDisplay}.${detectedMsg}`);
            err.statusCode = 400;
            throw err;
        }
        const fileName = input.fileName?.trim() ||
            `snippet.${this.getDefaultExtensionForLanguage(normalizedLang)}`;
        // 3. Static Analysis
        const staticResult = await analysis_1.AnalyzerRegistry.analyze(normalizedLang, input.sourceCode, fileName);
        // 4. Grounded Historical Intelligence Retrieval
        const historicalResult = await historicalHook_1.HistoricalAnalysisHook.analyze(input.sourceCode, normalizedLang, staticResult.findings);
        // 5. AI Multi-Dimensional Analysis with Grounded Historical Context
        const aiResult = await ai_1.AIService.analyze({
            language: normalizedLang,
            fileName,
            sourceCode: input.sourceCode,
            staticFindings: staticResult.findings,
            historicalRules: historicalResult.matches,
        });
        // 6. Merge and Deduplicate Findings
        const combinedFindings = [...staticResult.findings];
        aiResult.findings.forEach((aiFinding) => {
            const isDuplicate = combinedFindings.some((existing) => Math.abs(existing.lineStart - aiFinding.lineStart) <= 1 &&
                existing.category === aiFinding.category);
            if (!isDuplicate) {
                combinedFindings.push(aiFinding);
            }
        });
        // Sort findings by line number
        combinedFindings.sort((a, b) => a.lineStart - b.lineStart);
        // 7. Calculate Deterministic Quality Score and Sub-Metrics
        const scoreResult = scoringService_1.ScoringService.calculateQualityScore(combinedFindings, aiResult.metrics);
        const executionTimeMs = Date.now() - startTime;
        const reviewIdString = `REV-${crypto_1.default.randomBytes(3).toString('hex').toUpperCase()}`;
        // 8. Calculate Risk Forecast for Review
        let riskForecastData = undefined;
        try {
            const { DnaService } = await Promise.resolve().then(() => __importStar(require('./dna.service')));
            const { RiskCalculator } = await Promise.resolve().then(() => __importStar(require('./risk/riskCalculator')));
            const userDna = await DnaService.getDnaProfile(userId);
            const forecast = RiskCalculator.calculateRisk({
                language: normalizedLang,
                fileName,
                sourceCode: input.sourceCode,
                findings: combinedFindings,
                historicalRules: historicalResult.matches,
                dna: userDna,
            });
            riskForecastData = {
                overallRisk: forecast.overallRiskLevel,
                riskPercent: forecast.overallRiskPercent,
                confidence: forecast.confidencePercent / 100,
                personalization: forecast.personalization,
                primaryFactor: forecast.primaryCategory,
                recommendation: forecast.recommendation,
            };
        }
        catch (riskErr) {
            console.warn(`⚠️ Risk forecast calculation skipped: ${riskErr.message}`);
        }
        // 9. Save Review with Historical Context & Risk Forecast to MongoDB
        const reviewDoc = await models_1.Review.create({
            userId,
            reviewIdString,
            fileName,
            language: normalizedLang,
            sourceCode: input.sourceCode,
            status: 'completed',
            qualityScore: scoreResult.score,
            scoreDelta: scoreResult.scoreDelta,
            aiSummary: aiResult.summary,
            issuesCount: scoreResult.issuesCount,
            criticalCount: scoreResult.criticalCount,
            warningCount: scoreResult.warningCount,
            findings: combinedFindings,
            metrics: scoreResult.metrics,
            analysisMetadata: {
                analyzerUsed: `Hybrid (${staticResult.staticRulesApplied} static rules + ${aiResult.modelUsed})`,
                executionTimeMs,
                aiModel: aiResult.modelUsed,
                languageDetected: normalizedLang,
            },
            historicalContext: {
                matchedRules: historicalResult.matches,
                rulesUsedCount: historicalResult.rulesUsedCount,
                retrievalMethod: historicalResult.retrievalMethod,
            },
            riskForecast: riskForecastData,
        });
        // 9. Asynchronously update Developer Code DNA
        try {
            const { DnaService } = await Promise.resolve().then(() => __importStar(require('./dna.service')));
            await DnaService.calculateAndSaveDNA(userId);
        }
        catch (dnaErr) {
            console.warn(`⚠️ Failed to update Code DNA after review: ${dnaErr.message}`);
        }
        // 10. Update Achievements (XP, Level, Badges, Streak)
        try {
            const { AchievementService } = await Promise.resolve().then(() => __importStar(require('./achievement.service')));
            await AchievementService.recordReviewCompletion(userId, reviewDoc);
        }
        catch (achErr) {
            console.warn(`⚠️ Failed to update Achievements after review: ${achErr.message}`);
        }
        return reviewDoc;
    }
    static async getUserReviews(userId, page = 1, limit = 10) {
        const pageNum = Math.max(1, page);
        const limitNum = Math.max(1, Math.min(50, limit));
        const skip = (pageNum - 1) * limitNum;
        const [reviews, total] = await Promise.all([
            models_1.Review.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            models_1.Review.countDocuments({ userId }),
        ]);
        const totalPages = Math.ceil(total / limitNum) || 1;
        return {
            reviews,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
        };
    }
    static async getReviewById(reviewIdString, userId) {
        const isObjectId = reviewIdString.match(/^[0-9a-fA-F]{24}$/);
        return await models_1.Review.findOne({
            $and: [
                { userId },
                {
                    $or: [
                        { reviewIdString },
                        { _id: isObjectId ? reviewIdString : null },
                    ],
                },
            ],
        });
    }
    static async getReviewHistoricalContext(reviewIdString, userId) {
        const review = await this.getReviewById(reviewIdString, userId);
        if (!review)
            return null;
        return review.historicalContext || { matchedRules: [], rulesUsedCount: 0, retrievalMethod: 'none' };
    }
    static async deleteReview(reviewIdString, userId) {
        const isObjectId = reviewIdString.match(/^[0-9a-fA-F]{24}$/);
        const deleted = await models_1.Review.findOneAndDelete({
            $and: [
                { userId },
                {
                    $or: [
                        { reviewIdString },
                        { _id: isObjectId ? reviewIdString : null },
                    ],
                },
            ],
        });
        if (deleted) {
            try {
                const { DnaService } = await Promise.resolve().then(() => __importStar(require('./dna.service')));
                await DnaService.calculateAndSaveDNA(userId);
            }
            catch (dnaErr) {
                console.warn(`⚠️ Failed to recalculate Code DNA after review deletion: ${dnaErr.message}`);
            }
            try {
                const { AchievementService } = await Promise.resolve().then(() => __importStar(require('./achievement.service')));
                await AchievementService.recalculateUserAchievements(userId);
            }
            catch (achErr) {
                console.warn(`⚠️ Failed to recalculate achievements after review deletion: ${achErr.message}`);
            }
        }
        return Boolean(deleted);
    }
    static getDefaultExtensionForLanguage(lang) {
        const map = {
            javascript: 'js',
            typescript: 'ts',
            python: 'py',
            java: 'java',
            cpp: 'cpp',
            c: 'c',
            go: 'go',
            rust: 'rs',
            php: 'php',
            sql: 'sql',
        };
        return map[lang] || 'txt';
    }
}
exports.ReviewService = ReviewService;
//# sourceMappingURL=review.service.js.map