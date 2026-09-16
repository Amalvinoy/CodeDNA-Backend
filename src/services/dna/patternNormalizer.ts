import { ICodeFinding } from '../../models';

export interface NormalizedPatternInfo {
  key: string;
  category: 'correctness' | 'security' | 'performance' | 'architecture' | 'maintainability' | 'style';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export class PatternNormalizer {
  static normalizeFinding(finding: ICodeFinding): NormalizedPatternInfo {
    const text = `${finding.title} ${finding.description}`.toLowerCase();
    const category = finding.category || 'correctness';

    // 1. Security Patterns
    if (text.includes('sql') && (text.includes('injection') || text.includes('interpolation') || text.includes('concatenate'))) {
      return {
        key: 'security.sql_injection',
        category: 'security',
        title: 'SQL Injection in Query Construction',
        description: 'Interpolates unsanitized user parameters directly into database queries instead of using prepared statements.',
        severity: 'critical',
      };
    }

    if (text.includes('eval') || text.includes('exec(') || text.includes('arbitrary code')) {
      return {
        key: 'security.eval_execution',
        category: 'security',
        title: 'Dynamic Code Evaluation via eval()',
        description: 'Executes untrusted string inputs directly as code, enabling remote code execution exploits.',
        severity: 'critical',
      };
    }

    if (text.includes('innerhtml') || text.includes('xss') || text.includes('cross-site')) {
      return {
        key: 'security.xss_innerhtml',
        category: 'security',
        title: 'DOM XSS via Unsanitized HTML',
        description: 'Injects unescaped dynamic strings into the DOM via innerHTML.',
        severity: 'high',
      };
    }

    if (text.includes('gets(') || text.includes('strcpy') || text.includes('buffer overflow')) {
      return {
        key: 'security.buffer_overflow',
        category: 'security',
        title: 'Buffer Overflow Hazard',
        description: 'Uses unbounded memory copy functions that risk stack memory corruption.',
        severity: 'critical',
      };
    }

    // 2. Performance Patterns
    if (text.includes('n+1') || (text.includes('loop') && (text.includes('query') || text.includes('database') || text.includes('lookup')))) {
      return {
        key: 'performance.n_plus_one',
        category: 'performance',
        title: 'N+1 Database Query in Loop',
        description: 'Executes individual database lookups inside loops rather than batching or eager loading.',
        severity: 'high',
      };
    }

    if (text.includes('wildcard') || (text.includes('like') && text.includes('index'))) {
      return {
        key: 'performance.unindexed_wildcard',
        category: 'performance',
        title: 'Unindexed Leading Wildcard Query',
        description: 'Uses leading wildcard patterns in LIKE queries, forcing full table scans.',
        severity: 'medium',
      };
    }

    if (text.includes('select *') || text.includes('select-star')) {
      return {
        key: 'performance.select_all_columns',
        category: 'performance',
        title: 'Over-fetching via SELECT *',
        description: 'Queries all table columns unnecessarily, increasing I/O overhead.',
        severity: 'low',
      };
    }

    if (text.includes('system.gc') || text.includes('garbage collection')) {
      return {
        key: 'performance.explicit_gc',
        category: 'performance',
        title: 'Explicit System.gc() Call',
        description: 'Triggers Stop-The-World JVM garbage collection pauses manually.',
        severity: 'medium',
      };
    }

    // 3. Correctness Patterns
    if (text.includes('mutable default') || (text.includes('default') && text.includes('argument') && text.includes('python'))) {
      return {
        key: 'correctness.mutable_default_arg',
        category: 'correctness',
        title: 'Mutable Default Argument in Python',
        description: 'Uses mutable objects as default function parameters, causing persistent shared state across invocations.',
        severity: 'high',
      };
    }

    if (text.includes('unhandled error') || text.includes('blank identifier') || text.includes('ignored error')) {
      return {
        key: 'correctness.unhandled_error',
        category: 'correctness',
        title: 'Ignored or Unhandled Error Return',
        description: 'Discards error return values silently, leading to cascading runtime crashes.',
        severity: 'medium',
      };
    }

    if (text.includes('unwrap()') || text.includes('panic') || text.includes('non-null assertion')) {
      return {
        key: 'correctness.unsafe_assertion_panic',
        category: 'correctness',
        title: 'Unchecked Assertion / Panic Hazard',
        description: 'Directly unwraps nullable or fallible results without safety guards.',
        severity: 'medium',
      };
    }

    if (text.includes('loose equality') || text.includes('strict equality') || text.includes('===')) {
      return {
        key: 'correctness.loose_equality',
        category: 'correctness',
        title: 'Loose Equality Coercion',
        description: 'Uses loose == comparisons that cause unintended type coercions.',
        severity: 'low',
      };
    }

    // 4. Maintainability Patterns
    if (text.includes('any') && (text.includes('type') || text.includes('typescript'))) {
      return {
        key: 'maintainability.unsafe_any_type',
        category: 'maintainability',
        title: 'Overuse of Unsafe any Type',
        description: 'Bypasses compile-time type checking in TypeScript by using any.',
        severity: 'medium',
      };
    }

    if (text.includes('bare except') || text.includes('empty catch')) {
      return {
        key: 'maintainability.broad_exception_catch',
        category: 'maintainability',
        title: 'Broad or Bare Exception Catching',
        description: 'Swallows exceptions indiscriminately without targeted handling or logging.',
        severity: 'medium',
      };
    }

    // Default Fallback Key based on category & title slug
    const slug = finding.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
    return {
      key: `${category}.${slug}`,
      category,
      title: finding.title,
      description: finding.description,
      severity: finding.severity || 'medium',
    };
  }
}
