import crypto from 'crypto';
import { Review, IReview, ICodeFinding, IReviewHistoricalContext } from '../models';
import { LanguageDetector, SupportedLanguage, AnalyzerRegistry } from './analysis';
import { HistoricalAnalysisHook } from './historical/historicalHook';
import { AIService } from './ai';
import { ScoringService } from './scoring/scoringService';

export interface SubmitReviewInput {
  language: string;
  fileName?: string;
  sourceCode: string;
}

export interface PaginatedReviewsResult {
  reviews: IReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ReviewService {
  private static readonly MAX_CODE_SIZE_BYTES = 500 * 1024; // 500 KB

  static async submitReview(
    userId: string,
    input: SubmitReviewInput
  ): Promise<IReview> {
    const startTime = Date.now();

    // 1. Validate Source Code
    if (!input.sourceCode || typeof input.sourceCode !== 'string' || !input.sourceCode.trim()) {
      const err: any = new Error('Source code cannot be empty.');
      err.statusCode = 400;
      throw err;
    }

    const codeBytes = Buffer.byteLength(input.sourceCode, 'utf8');
    if (codeBytes > this.MAX_CODE_SIZE_BYTES) {
      const err: any = new Error(
        `Source code size (${Math.round(codeBytes / 1024)}KB) exceeds maximum allowable limit (500KB).`
      );
      err.statusCode = 400;
      throw err;
    }

    // 2. Normalize and Validate Language
    const normalizedLang = LanguageDetector.normalizeLanguage(input.language);
    if (!normalizedLang) {
      const err: any = new Error(
        `Unsupported programming language "${input.language}". Supported: ${LanguageDetector.getSupportedLanguagesList().join(
          ', '
        )}.`
      );
      err.statusCode = 400;
      throw err;
    }

    // Validate language against code syntax
    const langValidation = LanguageDetector.validateLanguageWithCode(
      normalizedLang,
      input.sourceCode
    );
    if (!langValidation.isValid) {
      const selectedDisplay = LanguageDetector.getDisplayName(normalizedLang);
      const detectedMsg = langValidation.suggestedLanguage
        ? ` Detected: ${LanguageDetector.getDisplayName(langValidation.suggestedLanguage)}.`
        : '';
      const err: any = new Error(
        langValidation.warning ||
          `Selected language does not match the submitted source code. Selected: ${selectedDisplay}.${detectedMsg}`
      );
      err.statusCode = 400;
      throw err;
    }

    const fileName =
      input.fileName?.trim() ||
      `snippet.${this.getDefaultExtensionForLanguage(normalizedLang)}`;

    // 3. Static Analysis
    const staticResult = await AnalyzerRegistry.analyze(
      normalizedLang,
      input.sourceCode,
      fileName
    );

    // 4. Grounded Historical Intelligence Retrieval
    const historicalResult = await HistoricalAnalysisHook.analyze(
      input.sourceCode,
      normalizedLang,
      staticResult.findings
    );

    // 5. AI Multi-Dimensional Analysis with Grounded Historical Context
    const aiResult = await AIService.analyze({
      language: normalizedLang,
      fileName,
      sourceCode: input.sourceCode,
      staticFindings: staticResult.findings,
      historicalRules: historicalResult.matches,
    });

    // 6. Merge and Deduplicate Findings
    const combinedFindings: ICodeFinding[] = [...staticResult.findings];

    aiResult.findings.forEach((aiFinding) => {
      const isDuplicate = combinedFindings.some(
        (existing) =>
          Math.abs(existing.lineStart - aiFinding.lineStart) <= 1 &&
          existing.category === aiFinding.category
      );
      if (!isDuplicate) {
        combinedFindings.push(aiFinding);
      }
    });

    // Sort findings by line number
    combinedFindings.sort((a, b) => a.lineStart - b.lineStart);

    // 7. Calculate Deterministic Quality Score and Sub-Metrics
    const scoreResult = ScoringService.calculateQualityScore(
      combinedFindings,
      aiResult.metrics
    );

    const executionTimeMs = Date.now() - startTime;
    const reviewIdString = `REV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // 8. Calculate Risk Forecast for Review
    let riskForecastData: any = undefined;
    try {
      const { DnaService } = await import('./dna.service');
      const { RiskCalculator } = await import('./risk/riskCalculator');
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
    } catch (riskErr: any) {
      console.warn(`⚠️ Risk forecast calculation skipped: ${riskErr.message}`);
    }

    // 9. Save Review with Historical Context & Risk Forecast to MongoDB
    const reviewDoc = await Review.create({
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
      const { DnaService } = await import('./dna.service');
      await DnaService.calculateAndSaveDNA(userId);
    } catch (dnaErr: any) {
      console.warn(`⚠️ Failed to update Code DNA after review: ${dnaErr.message}`);
    }

    // 10. Update Achievements (XP, Level, Badges, Streak)
    try {
      const { AchievementService } = await import('./achievement.service');
      await AchievementService.recordReviewCompletion(userId, reviewDoc);
    } catch (achErr: any) {
      console.warn(`⚠️ Failed to update Achievements after review: ${achErr.message}`);
    }

    return reviewDoc;
  }

  static async getUserReviews(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedReviewsResult> {
    const pageNum = Math.max(1, page);
    const limitNum = Math.max(1, Math.min(50, limit));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Review.countDocuments({ userId }),
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

  static async getReviewById(
    reviewIdString: string,
    userId: string
  ): Promise<IReview | null> {
    const isObjectId = reviewIdString.match(/^[0-9a-fA-F]{24}$/);
    return await Review.findOne({
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

  static async getReviewHistoricalContext(
    reviewIdString: string,
    userId: string
  ): Promise<IReviewHistoricalContext | null> {
    const review = await this.getReviewById(reviewIdString, userId);
    if (!review) return null;
    return review.historicalContext || { matchedRules: [], rulesUsedCount: 0, retrievalMethod: 'none' };
  }

  static async deleteReview(
    reviewIdString: string,
    userId: string
  ): Promise<boolean> {
    const isObjectId = reviewIdString.match(/^[0-9a-fA-F]{24}$/);
    const deleted = await Review.findOneAndDelete({
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
        const { DnaService } = await import('./dna.service');
        await DnaService.calculateAndSaveDNA(userId);
      } catch (dnaErr: any) {
        console.warn(`⚠️ Failed to recalculate Code DNA after review deletion: ${dnaErr.message}`);
      }

      try {
        const { AchievementService } = await import('./achievement.service');
        await AchievementService.recalculateUserAchievements(userId);
      } catch (achErr: any) {
        console.warn(`⚠️ Failed to recalculate achievements after review deletion: ${achErr.message}`);
      }
    }
    return Boolean(deleted);
  }

  private static getDefaultExtensionForLanguage(lang: SupportedLanguage): string {
    const map: Record<SupportedLanguage, string> = {
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
