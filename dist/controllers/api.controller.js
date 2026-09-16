"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiController = void 0;
const review_service_1 = require("../services/review.service");
const dna_service_1 = require("../services/dna.service");
const risk_service_1 = require("../services/risk/risk.service");
const battle_service_1 = require("../services/battle/battle.service");
const achievement_service_1 = require("../services/achievement.service");
const historical_1 = require("../services/historical");
const analysis_1 = require("../services/analysis");
const settings_service_1 = require("../services/settings.service");
const review_validator_1 = require("../validators/review.validator");
const settings_validator_1 = require("../validators/settings.validator");
class ApiController {
    // Reviews
    static async getReviews(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
            const result = await review_service_1.ReviewService.getUserReviews(userId, page, limit);
            res.json({
                success: true,
                data: result.reviews,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getReviewById(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const review = await review_service_1.ReviewService.getReviewById(req.params.id, userId);
            if (!review) {
                return res.status(404).json({ success: false, message: 'Review not found or unauthorized' });
            }
            res.json({ success: true, data: review });
        }
        catch (err) {
            next(err);
        }
    }
    static async getReviewHistoricalContext(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const context = await review_service_1.ReviewService.getReviewHistoricalContext(req.params.id, userId);
            if (!context) {
                return res.status(404).json({ success: false, message: 'Review not found or unauthorized' });
            }
            res.json({ success: true, data: context });
        }
        catch (err) {
            next(err);
        }
    }
    static async createReview(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            // Validate input payload
            const parsed = review_validator_1.submitReviewSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: parsed.error.errors[0]?.message || 'Invalid review input.',
                });
            }
            const newReview = await review_service_1.ReviewService.submitReview(userId, parsed.data);
            res.status(201).json({
                success: true,
                message: 'Review completed successfully.',
                data: newReview,
            });
        }
        catch (err) {
            if (err.statusCode) {
                return res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                });
            }
            next(err);
        }
    }
    static async deleteReview(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const deleted = await review_service_1.ReviewService.deleteReview(req.params.id, userId);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Review not found or unauthorized' });
            }
            res.json({
                success: true,
                message: 'Review deleted successfully.',
            });
        }
        catch (err) {
            next(err);
        }
    }
    // Developer Code DNA
    static async getCodeDna(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const dna = await dna_service_1.DnaService.getDnaProfile(userId);
            res.json({ success: true, data: dna });
        }
        catch (err) {
            next(err);
        }
    }
    static async getDnaSummary(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const summary = await dna_service_1.DnaService.getDnaSummary(userId);
            res.json({ success: true, data: summary });
        }
        catch (err) {
            next(err);
        }
    }
    static async getDnaPatterns(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const patterns = await dna_service_1.DnaService.getDnaPatterns(userId);
            res.json({ success: true, data: patterns });
        }
        catch (err) {
            next(err);
        }
    }
    static async getDnaTrends(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const trends = await dna_service_1.DnaService.getDnaTrends(userId);
            res.json({ success: true, data: trends });
        }
        catch (err) {
            next(err);
        }
    }
    static async rebuildCodeDna(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const rebuilt = await dna_service_1.DnaService.rebuildCodeDNA(userId);
            res.json({
                success: true,
                message: 'Code DNA profile rebuilt successfully.',
                data: rebuilt,
            });
        }
        catch (err) {
            next(err);
        }
    }
    // Historical Rules & Engineering Memory
    static async getHistoricalRules(req, res, next) {
        try {
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
            const category = req.query.category;
            const search = req.query.search;
            const result = await historical_1.HistoricalRuleService.getAllRules({ category, search, page, limit });
            res.json({
                success: true,
                data: result.rules,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async testHistoricalSearch(req, res, next) {
        try {
            const { code, language } = req.body;
            if (!code) {
                return res.status(400).json({ success: false, message: 'Source code is required' });
            }
            const result = await historical_1.HistoricalRetriever.retrieveRelevantRules({
                code,
                language: language || 'python',
                limit: 5,
            });
            res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async importHistoricalRules(req, res, next) {
        try {
            const { csvContent } = req.body;
            if (!csvContent || typeof csvContent !== 'string') {
                return res.status(400).json({ success: false, message: 'Valid CSV content string is required' });
            }
            const report = await historical_1.HistoricalIngestionService.importFromCSVContent(csvContent);
            res.json({
                success: true,
                message: 'Historical rules imported successfully',
                data: report,
            });
        }
        catch (err) {
            res.status(400).json({
                success: false,
                message: err.message || 'CSV Import failed',
            });
        }
    }
    // Risk Prediction
    static async getRiskPrediction(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const risk = await risk_service_1.RiskService.getPredictiveRisk(userId);
            res.json({ success: true, data: risk });
        }
        catch (err) {
            next(err);
        }
    }
    static async forecastRisk(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const { language, fileName, sourceCode } = req.body;
            if (!sourceCode || typeof sourceCode !== 'string' || !sourceCode.trim()) {
                return res.status(400).json({ success: false, message: 'Source code cannot be empty.' });
            }
            if (!language || typeof language !== 'string' || !language.trim()) {
                return res.status(400).json({ success: false, message: 'Programming language is required.' });
            }
            const normalizedLang = analysis_1.LanguageDetector.normalizeLanguage(language);
            if (!normalizedLang) {
                return res.status(400).json({
                    success: false,
                    message: `Unsupported language: '${language}'. Supported languages are: ${analysis_1.LanguageDetector.getSupportedLanguagesList().join(', ')}`,
                });
            }
            const forecast = await risk_service_1.RiskService.forecastRisk(userId, {
                language: normalizedLang,
                fileName: fileName?.trim() || 'source.code',
                sourceCode: sourceCode.trim(),
            });
            res.json({ success: true, data: forecast });
        }
        catch (err) {
            if (err.statusCode) {
                return res.status(err.statusCode).json({ success: false, message: err.message });
            }
            res.status(500).json({ success: false, message: err.message || 'Failed to compute risk forecast' });
        }
    }
    // Code Battle
    static async getCodeBattle(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const battle = await battle_service_1.BattleService.getBattleData(userId);
            res.json({ success: true, data: battle });
        }
        catch (err) {
            next(err);
        }
    }
    static async generateBattle(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const { file, language, originalCode } = req.body;
            if (!originalCode || typeof originalCode !== 'string' || !originalCode.trim()) {
                return res.status(400).json({ success: false, message: 'Source code cannot be empty.' });
            }
            if (!language || typeof language !== 'string' || !language.trim()) {
                return res.status(400).json({ success: false, message: 'Programming language is required.' });
            }
            const normalizedLang = analysis_1.LanguageDetector.normalizeLanguage(language);
            if (!normalizedLang) {
                return res.status(400).json({
                    success: false,
                    message: `Unsupported language: '${language}'. Supported languages are: ${analysis_1.LanguageDetector.getSupportedLanguagesList().join(', ')}`,
                });
            }
            try {
                const result = await battle_service_1.BattleService.generateBattle(userId, {
                    file: file?.trim() || 'source.code',
                    language: normalizedLang,
                    originalCode: originalCode.trim(),
                });
                res.json({ success: true, data: result });
            }
            catch (err) {
                if (err.message && err.message.includes('AI optimization unavailable')) {
                    return res.status(503).json({
                        success: false,
                        message: 'AI optimization unavailable. Please ensure an AI provider is configured or try again later.',
                    });
                }
                throw err;
            }
        }
        catch (err) {
            next(err);
        }
    }
    static async submitDefense(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const { reasoning } = req.body;
            if (!reasoning || typeof reasoning !== 'string' || !reasoning.trim()) {
                return res.status(400).json({ success: false, message: 'Defense reasoning cannot be empty.' });
            }
            const result = await battle_service_1.BattleService.submitDefense(userId, reasoning.trim());
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    // Achievements
    static async getAchievements(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const achievements = await achievement_service_1.AchievementService.getAchievements(userId);
            res.json({ success: true, data: achievements });
        }
        catch (err) {
            next(err);
        }
    }
    // Settings
    static async getSettings(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const settings = await settings_service_1.SettingsService.getSettings(userId);
            res.json({ success: true, data: settings });
        }
        catch (err) {
            next(err);
        }
    }
    static async updateSettings(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const parsed = settings_validator_1.updateSettingsSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: parsed.error.errors[0]?.message || 'Invalid settings data',
                });
            }
            // Strictly pass req.user.userId only - never trust client-supplied userId
            const updatedSettings = await settings_service_1.SettingsService.updateSettings(userId, parsed.data);
            res.json({
                success: true,
                message: 'Settings updated successfully',
                data: updatedSettings,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ApiController = ApiController;
//# sourceMappingURL=api.controller.js.map