import { HistoricalRule, IHistoricalRule, ICodeFinding, IMatchedHistoricalRule } from '../../models';
import { EmbeddingService } from '../embeddings';
import { env } from '../../config/env';

export interface RetrieveRulesParams {
  code: string;
  language: string;
  findings?: ICodeFinding[];
  limit?: number;
  threshold?: number;
}

export interface RetrievalResult {
  matches: IMatchedHistoricalRule[];
  rulesUsedCount: number;
  retrievalMethod: 'vector' | 'semantic-hybrid' | 'none';
}

export class HistoricalRetriever {
  private static readonly DEFAULT_THRESHOLD = 0.65;
  private static readonly DEFAULT_TOP_K = 3;

  static async retrieveRelevantRules(params: RetrieveRulesParams): Promise<RetrievalResult> {
    const limit = Math.max(1, Math.min(5, params.limit || this.DEFAULT_TOP_K));
    const threshold =
      params.threshold ??
      (env.HISTORICAL_MATCH_THRESHOLD
        ? parseFloat(env.HISTORICAL_MATCH_THRESHOLD)
        : this.DEFAULT_THRESHOLD);

    try {
      // 1. Fetch all indexed historical rules from MongoDB
      const allRules = (await HistoricalRule.find({})) as IHistoricalRule[];
      if (!allRules || allRules.length === 0) {
        return {
          matches: [],
          rulesUsedCount: 0,
          retrievalMethod: 'none',
        };
      }

      // 2. Build multi-stage query representations
      const findingSignals = (params.findings || [])
        .map((f) => `${f.title || ''} ${f.description || ''}`)
        .join(' ')
        .trim();

      const queryText = findingSignals
        ? `${findingSignals} ${(params.code || '').slice(0, 1000)}`
        : (params.code || '').slice(0, 1000);

      // 3. Generate query embedding
      const queryVector = await EmbeddingService.generateEmbedding(queryText);

      // 4. Compute similarity scores across all rules
      const scoredRules: {
        rule: IHistoricalRule;
        similarity: number;
        reason: string;
      }[] = [];

      for (const rule of allRules) {
        let similarity = 0;

        if (rule.embedding && rule.embedding.length > 0) {
          similarity = EmbeddingService.cosineSimilarity(rule.embedding, queryVector);
        } else {
          // Keyword fallback if embedding was not precomputed
          const normalizedCode = (params.code || '').toLowerCase();
          const desc = (rule.normalizedDescription || rule.description || '').toLowerCase();
          const ruleWords = desc.split(' ').filter((w) => w.length > 3);
          const matchCount = ruleWords.filter((w) => normalizedCode.includes(w)).length;
          similarity = Math.min(0.85, matchCount / Math.max(4, ruleWords.length));
        }

        const ruleType = (rule.type || 'general').toLowerCase();

        // Semantic reinforcement if findings directly relate to rule type
        const matchesFindingCategory = (params.findings || []).some(
          (f) => (f.category || '').toLowerCase() === ruleType
        );
        if (matchesFindingCategory && similarity > 0.4) {
          similarity = Math.min(0.99, similarity + 0.1);
        }

        if (similarity >= threshold) {
          let reason = `Matches historical ${ruleType} pattern`;
          if (ruleType === 'security') {
            reason = 'Enforces historical engineering security defense policy';
          } else if (ruleType === 'performance') {
            reason = 'Enforces past high-throughput latency and resource caching optimization';
          } else if (ruleType === 'correctness') {
            reason = 'Prevents known historical runtime exception pattern';
          }

          scoredRules.push({
            rule,
            similarity: Math.round(similarity * 100) / 100,
            reason,
          });
        }
      }

      // 5. Rank and select Top-K
      scoredRules.sort((a, b) => b.similarity - a.similarity);
      const topMatches = scoredRules.slice(0, limit);

      const matches: IMatchedHistoricalRule[] = topMatches.map((item) => ({
        ruleId: (item.rule as any)._id?.toString() || item.rule.externalId,
        externalId: item.rule.externalId,
        type: item.rule.type || 'general',
        description: item.rule.description || '',
        similarity: item.similarity,
        relevance: item.similarity >= 0.85 ? 'high' : 'medium',
        reason: item.reason,
      }));

      return {
        matches,
        rulesUsedCount: matches.length,
        retrievalMethod: matches.length > 0 ? 'semantic-hybrid' : 'none',
      };
    } catch (err: any) {
      console.warn(`⚠️ Historical retrieval failed: ${err.message}. Continuing review with zero matches.`);
      return {
        matches: [],
        rulesUsedCount: 0,
        retrievalMethod: 'none',
      };
    }
  }
}
