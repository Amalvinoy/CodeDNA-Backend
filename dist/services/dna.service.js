"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DnaService = void 0;
const models_1 = require("../models");
const dnaCalculator_1 = require("./dna/dnaCalculator");
class DnaService {
    static async getDnaProfile(userId) {
        let profile = await models_1.CodeDNA.findOne({ userId });
        if (!profile) {
            profile = await this.calculateAndSaveDNA(userId);
        }
        return profile;
    }
    static async calculateAndSaveDNA(userId) {
        // 1. Fetch all completed reviews for user
        const reviews = await models_1.Review.find({ userId, status: 'completed' })
            .sort({ createdAt: 1 })
            .select('-sourceCode'); // Exclude heavy source code strings for performance
        // 2. Compute updated profile
        const profileData = dnaCalculator_1.DnaCalculator.calculateProfile(userId, reviews);
        // 3. Upsert into MongoDB
        const updated = await models_1.CodeDNA.findOneAndUpdate({ userId }, { $set: profileData }, { upsert: true, new: true });
        return updated;
    }
    static async getDnaSummary(userId) {
        const profile = await this.getDnaProfile(userId);
        return {
            overallScore: profile.overallScore,
            level: profile.level,
            levelTitle: profile.levelTitle,
            reviewCount: profile.reviewCount,
            consistencyScore: profile.consistencyScore,
            strengthsCount: profile.strengths?.length || 0,
            weaknessesCount: profile.recurringWeaknesses?.length || 0,
            improvementMonthPercent: profile.improvementMonthPercent || 0,
        };
    }
    static async getDnaPatterns(userId) {
        const profile = await this.getDnaProfile(userId);
        return {
            patterns: profile.patterns || [],
            recurringWeaknesses: profile.recurringWeaknesses || [],
            patternHistory: profile.patternHistory || [],
        };
    }
    static async getDnaTrends(userId) {
        const profile = await this.getDnaProfile(userId);
        return {
            trends: profile.trends || [],
            evolutionTrajectory: profile.evolutionTrajectory || [],
            improvementMonthPercent: profile.improvementMonthPercent || 0,
        };
    }
    static async rebuildCodeDNA(userId) {
        return await this.calculateAndSaveDNA(userId);
    }
}
exports.DnaService = DnaService;
//# sourceMappingURL=dna.service.js.map