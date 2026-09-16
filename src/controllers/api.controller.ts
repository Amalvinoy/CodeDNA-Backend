import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { DnaService } from '../services/dna.service';
import { RiskService } from '../services/risk/risk.service';
import { BattleService } from '../services/battle/battle.service';
import { AchievementService } from '../services/achievement.service';
import { HistoricalRuleService, HistoricalRetriever, HistoricalIngestionService } from '../services/historical';
import { LanguageDetector } from '../services/analysis';
import { SettingsService } from '../services/settings.service';
import { submitReviewSchema } from '../validators/review.validator';
import { updateSettingsSchema } from '../validators/settings.validator';

export class ApiController {
  // Reviews
  static async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await ReviewService.getUserReviews(userId, page, limit);
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
    } catch (err) {
      next(err);
    }
  }

  static async getReviewById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const review = await ReviewService.getReviewById(req.params.id, userId);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found or unauthorized' });
      }
      res.json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  }

  static async getReviewHistoricalContext(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const context = await ReviewService.getReviewHistoricalContext(req.params.id, userId);
      if (!context) {
        return res.status(404).json({ success: false, message: 'Review not found or unauthorized' });
      }
      res.json({ success: true, data: context });
    } catch (err) {
      next(err);
    }
  }

  static async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Validate input payload
      const parsed = submitReviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid review input.',
        });
      }

      const newReview = await ReviewService.submitReview(userId, parsed.data);
      res.status(201).json({
        success: true,
        message: 'Review completed successfully.',
        data: newReview,
      });
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  }

  static async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const deleted = await ReviewService.deleteReview(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Review not found or unauthorized' });
      }

      res.json({
        success: true,
        message: 'Review deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  // Developer Code DNA
  static async getCodeDna(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const dna = await DnaService.getDnaProfile(userId);
      res.json({ success: true, data: dna });
    } catch (err) {
      next(err);
    }
  }

  static async getDnaSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const summary = await DnaService.getDnaSummary(userId);
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  static async getDnaPatterns(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const patterns = await DnaService.getDnaPatterns(userId);
      res.json({ success: true, data: patterns });
    } catch (err) {
      next(err);
    }
  }

  static async getDnaTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const trends = await DnaService.getDnaTrends(userId);
      res.json({ success: true, data: trends });
    } catch (err) {
      next(err);
    }
  }

  static async rebuildCodeDna(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const rebuilt = await DnaService.rebuildCodeDNA(userId);
      res.json({
        success: true,
        message: 'Code DNA profile rebuilt successfully.',
        data: rebuilt,
      });
    } catch (err) {
      next(err);
    }
  }

  // Historical Rules & Engineering Memory
  static async getHistoricalRules(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const category = req.query.category as string;
      const search = req.query.search as string;

      const result = await HistoricalRuleService.getAllRules({ category, search, page, limit });
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
    } catch (err) {
      next(err);
    }
  }

  static async testHistoricalSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, language } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Source code is required' });
      }

      const result = await HistoricalRetriever.retrieveRelevantRules({
        code,
        language: language || 'python',
        limit: 5,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async importHistoricalRules(req: Request, res: Response, next: NextFunction) {
    try {
      const { csvContent } = req.body;
      if (!csvContent || typeof csvContent !== 'string') {
        return res.status(400).json({ success: false, message: 'Valid CSV content string is required' });
      }

      const report = await HistoricalIngestionService.importFromCSVContent(csvContent);
      res.json({
        success: true,
        message: 'Historical rules imported successfully',
        data: report,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'CSV Import failed',
      });
    }
  }

  // Risk Prediction
  static async getRiskPrediction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const risk = await RiskService.getPredictiveRisk(userId);
      res.json({ success: true, data: risk });
    } catch (err) {
      next(err);
    }
  }

  static async forecastRisk(req: Request, res: Response, next: NextFunction) {
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

      const normalizedLang = LanguageDetector.normalizeLanguage(language);
      if (!normalizedLang) {
        return res.status(400).json({
          success: false,
          message: `Unsupported language: '${language}'. Supported languages are: ${LanguageDetector.getSupportedLanguagesList().join(', ')}`,
        });
      }

      const forecast = await RiskService.forecastRisk(userId, {
        language: normalizedLang,
        fileName: fileName?.trim() || 'source.code',
        sourceCode: sourceCode.trim(),
      });
      res.json({ success: true, data: forecast });
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
      }
      res.status(500).json({ success: false, message: err.message || 'Failed to compute risk forecast' });
    }
  }

  // Code Battle
  static async getCodeBattle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const battle = await BattleService.getBattleData(userId);
      res.json({ success: true, data: battle });
    } catch (err) {
      next(err);
    }
  }

  static async generateBattle(req: Request, res: Response, next: NextFunction) {
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

      const normalizedLang = LanguageDetector.normalizeLanguage(language);
      if (!normalizedLang) {
        return res.status(400).json({
          success: false,
          message: `Unsupported language: '${language}'. Supported languages are: ${LanguageDetector.getSupportedLanguagesList().join(', ')}`,
        });
      }

      try {
        const result = await BattleService.generateBattle(userId, {
          file: file?.trim() || 'source.code',
          language: normalizedLang,
          originalCode: originalCode.trim(),
        });
        res.json({ success: true, data: result });
      } catch (err: any) {
        if (err.message && err.message.includes('AI optimization unavailable')) {
          return res.status(503).json({
            success: false,
            message: 'AI optimization unavailable. Please ensure an AI provider is configured or try again later.',
          });
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  }

  static async submitDefense(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const { reasoning } = req.body;
      if (!reasoning || typeof reasoning !== 'string' || !reasoning.trim()) {
        return res.status(400).json({ success: false, message: 'Defense reasoning cannot be empty.' });
      }
      const result = await BattleService.submitDefense(userId, reasoning.trim());
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // Achievements
  static async getAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const achievements = await AchievementService.getAchievements(userId);
      res.json({ success: true, data: achievements });
    } catch (err) {
      next(err);
    }
  }

  // Settings
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const settings = await SettingsService.getSettings(userId);
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid settings data',
        });
      }

      // Strictly pass req.user.userId only - never trust client-supplied userId
      const updatedSettings = await SettingsService.updateSettings(userId, parsed.data);
      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: updatedSettings,
      });
    } catch (err) {
      next(err);
    }
  }
}
