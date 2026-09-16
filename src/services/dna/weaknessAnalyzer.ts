import { IReview, IDnaPattern, IDnaAreaForOptimization } from '../../models';
import { PatternNormalizer } from './patternNormalizer';

export interface PatternAggregationResult {
  allPatterns: IDnaPattern[];
  recurringWeaknesses: IDnaPattern[];
  areasForOptimization: IDnaAreaForOptimization[];
  patternHistory: {
    category: string;
    pastFrequency: number;
    currentFrequency: number;
  }[];
}

export class WeaknessAnalyzer {
  static analyzePatternsAndWeaknesses(reviews: IReview[]): PatternAggregationResult {
    if (!reviews || reviews.length === 0) {
      return {
        allPatterns: [],
        recurringWeaknesses: [],
        areasForOptimization: [],
        patternHistory: [],
      };
    }

    // Sort chronologically (oldest to newest)
    const sortedReviews = [...reviews].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const midPoint = Math.max(1, Math.floor(sortedReviews.length / 2));
    const pastReviews = sortedReviews.slice(0, midPoint);
    const recentReviews = sortedReviews.slice(midPoint);

    // Track patterns by key
    const patternMap = new Map<
      string,
      {
        key: string;
        category: string;
        title: string;
        description: string;
        severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
        occurrenceCount: number;
        pastCount: number;
        recentCount: number;
        firstDetectedAt: Date;
        lastDetectedAt: Date;
        affectedReviews: Set<string>;
      }
    >();

    // Scan past reviews
    pastReviews.forEach((review) => {
      const revId = review.reviewIdString || (review as any)._id?.toString() || 'REV';
      const revDate = new Date(review.createdAt || Date.now());

      (review.findings || []).forEach((finding) => {
        const normalized = PatternNormalizer.normalizeFinding(finding);
        let item = patternMap.get(normalized.key);
        if (!item) {
          item = {
            key: normalized.key,
            category: normalized.category,
            title: normalized.title,
            description: normalized.description,
            severity: normalized.severity,
            occurrenceCount: 0,
            pastCount: 0,
            recentCount: 0,
            firstDetectedAt: revDate,
            lastDetectedAt: revDate,
            affectedReviews: new Set(),
          };
          patternMap.set(normalized.key, item);
        }
        item.occurrenceCount++;
        item.pastCount++;
        item.affectedReviews.add(revId);
        if (revDate < item.firstDetectedAt) item.firstDetectedAt = revDate;
        if (revDate > item.lastDetectedAt) item.lastDetectedAt = revDate;
      });
    });

    // Scan recent reviews
    recentReviews.forEach((review) => {
      const revId = review.reviewIdString || (review as any)._id?.toString() || 'REV';
      const revDate = new Date(review.createdAt || Date.now());

      (review.findings || []).forEach((finding) => {
        const normalized = PatternNormalizer.normalizeFinding(finding);
        let item = patternMap.get(normalized.key);
        if (!item) {
          item = {
            key: normalized.key,
            category: normalized.category,
            title: normalized.title,
            description: normalized.description,
            severity: normalized.severity,
            occurrenceCount: 0,
            pastCount: 0,
            recentCount: 0,
            firstDetectedAt: revDate,
            lastDetectedAt: revDate,
            affectedReviews: new Set(),
          };
          patternMap.set(normalized.key, item);
        }
        item.occurrenceCount++;
        item.recentCount++;
        item.affectedReviews.add(revId);
        if (revDate < item.firstDetectedAt) item.firstDetectedAt = revDate;
        if (revDate > item.lastDetectedAt) item.lastDetectedAt = revDate;
      });
    });

    const allPatterns: IDnaPattern[] = [];
    const recurringWeaknesses: IDnaPattern[] = [];
    const areasForOptimization: IDnaAreaForOptimization[] = [];

    // Category frequency tallies
    const categoryFrequencyMap: Record<string, { past: number; current: number }> = {
      Security: { past: 0, current: 0 },
      Performance: { past: 0, current: 0 },
      Architecture: { past: 0, current: 0 },
      Correctness: { past: 0, current: 0 },
      Maintainability: { past: 0, current: 0 },
    };

    patternMap.forEach((p) => {
      // Determine trend
      let trend: 'improving' | 'declining' | 'recurring' | 'stable' = 'stable';
      if (p.pastCount > 0 && p.recentCount === 0) {
        trend = 'improving'; // stopped appearing in recent reviews
      } else if (p.recentCount > p.pastCount) {
        trend = 'declining'; // getting worse
      } else if (p.occurrenceCount >= 2) {
        trend = 'recurring';
      }

      const patternDoc: IDnaPattern = {
        key: p.key,
        category: p.category.toUpperCase(),
        title: p.title,
        description: p.description,
        occurrenceCount: p.occurrenceCount,
        pastFrequency: p.pastCount,
        currentFrequency: p.recentCount,
        trend,
        confidence: Math.min(0.98, 0.7 + p.occurrenceCount * 0.08),
        firstDetectedAt: p.firstDetectedAt,
        lastDetectedAt: p.lastDetectedAt,
        affectedReviews: Array.from(p.affectedReviews),
      };

      allPatterns.push(patternDoc);

      // Recurring Weakness Rule: Appears in at least 2 reviews
      if (p.occurrenceCount >= 2) {
        recurringWeaknesses.push(patternDoc);

        const priority =
          p.severity === 'critical' || p.occurrenceCount >= 4
            ? 'High Priority'
            : p.severity === 'high' || p.occurrenceCount >= 3
            ? 'Medium Priority'
            : 'Low Priority';

        areasForOptimization.push({
          id: `opt-${p.key}`,
          key: p.key,
          category: p.category.toUpperCase(),
          title: p.title,
          priority,
          description: p.description,
          occurrenceCount: p.occurrenceCount,
        });
      }

      // Add to category tally
      const catKey = p.category.charAt(0).toUpperCase() + p.category.slice(1).toLowerCase();
      if (catKey in categoryFrequencyMap) {
        categoryFrequencyMap[catKey].past += p.pastCount;
        categoryFrequencyMap[catKey].current += p.recentCount;
      }
    });

    // Sort recurring weaknesses by occurrence count desc
    recurringWeaknesses.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
    areasForOptimization.sort((a, b) => (b.occurrenceCount || 0) - (a.occurrenceCount || 0));

    const patternHistory = Object.entries(categoryFrequencyMap).map(([category, freqs]) => ({
      category,
      pastFrequency: freqs.past,
      currentFrequency: freqs.current,
    }));

    return {
      allPatterns,
      recurringWeaknesses,
      areasForOptimization,
      patternHistory,
    };
  }
}
