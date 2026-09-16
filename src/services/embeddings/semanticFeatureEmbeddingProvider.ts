import { IEmbeddingProvider } from './embeddingProvider.interface';

export class SemanticFeatureEmbeddingProvider implements IEmbeddingProvider {
  readonly name = 'CodeDNA Deterministic Semantic Vectorizer';
  private static readonly VECTOR_DIMENSION = 64;

  // Domain-specific anti-pattern clusters mapping to vector buckets
  private static readonly CONCEPT_CLUSTERS: { name: string; bucket: number; keywords: string[] }[] = [
    {
      name: 'sql_database_injection',
      bucket: 0,
      keywords: ['sql', 'query', 'injection', 'interpolate', 'prepared statement', 'parameterized', 'raw sql', 'executesql'],
    },
    {
      name: 'n_plus_one_caching_loop',
      bucket: 4,
      keywords: ['n+1', 'batch database', 'cache lookup', 'repeated lookup', 'eager loading', 'query in loop'],
    },
    {
      name: 'dynamic_code_execution_eval',
      bucket: 8,
      keywords: ['eval(', 'exec(', 'dynamic code', 'arbitrary code execution', 'ast literal'],
    },
    {
      name: 'xss_html_dom_sanitization',
      bucket: 12,
      keywords: ['xss', 'innerhtml', 'dompurify', 'sanitize html', 'cross-site scripting'],
    },
    {
      name: 'auth_jwt_tokens',
      bucket: 16,
      keywords: ['jwt signature', 'token expiration', 'jwt secret', 'verify token', 'bearer auth'],
    },
    {
      name: 'cookie_session_security',
      bucket: 20,
      keywords: ['httponly', 'samesite', 'secure cookie', 'session cookie', 'cookie flags'],
    },
    {
      name: 'password_hashing',
      bucket: 24,
      keywords: ['plaintext password', 'bcrypt', 'argon2', 'password hash', 'salt hash'],
    },
    {
      name: 'rate_limiting_dos',
      bucket: 28,
      keywords: ['rate limit', 'dos throttle', 'retry storm', 'request throttle'],
    },
    {
      name: 'error_handling_exceptions',
      bucket: 32,
      keywords: ['unhandled error', 'bare except', 'blank identifier', 'ignored error', 'swallow error'],
    },
    {
      name: 'panic_unwrap_assertions',
      bucket: 36,
      keywords: ['unwrap()', 'expect(', 'thread panic', 'direct unwrap'],
    },
    {
      name: 'python_mutable_defaults',
      bucket: 40,
      keywords: ['mutable default', 'default argument', 'default list', 'default dict', 'shared default'],
    },
    {
      name: 'memory_buffer_overflow',
      bucket: 44,
      keywords: ['buffer overflow', 'strcpy(', 'gets(', 'sprintf(', 'format string vulnerability'],
    },
    {
      name: 'typing_any_safety',
      bucket: 48,
      keywords: ['unsafe any', 'any type', 'strict typing', 'explicit interface'],
    },
    {
      name: 'indexing_query_performance',
      bucket: 52,
      keywords: ['leading wildcard', 'table scan', 'b-tree index', 'like %', 'unindexed'],
    },
    {
      name: 'concurrency_mutex_goroutines',
      bucket: 56,
      keywords: ['goroutine leak', 'mutex lock', 'data race', 'shared mutable state'],
    },
    {
      name: 'gc_connection_pooling',
      bucket: 60,
      keywords: ['system.gc', 'connection pool', 'stop-the-world', 'explicit gc'],
    },
  ];

  isAvailable(): boolean {
    return true;
  }

  async embedText(text: string): Promise<number[]> {
    return this.generateVector(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.generateVector(t));
  }

  private generateVector(input: string): number[] {
    const vector = new Array(SemanticFeatureEmbeddingProvider.VECTOR_DIMENSION).fill(0);
    const normalized = input.toLowerCase().replace(/[^a-z0-9_+\-()\.]/g, ' ');
    const tokens = normalized.split(/\s+/).filter(Boolean);

    // 1. Concept Cluster Mapping
    SemanticFeatureEmbeddingProvider.CONCEPT_CLUSTERS.forEach((cluster) => {
      let clusterHits = 0;
      cluster.keywords.forEach((kw) => {
        if (normalized.includes(kw)) {
          clusterHits += 1;
        }
      });

      if (clusterHits > 0) {
        const primaryBucket = cluster.bucket;
        vector[primaryBucket] += clusterHits * 6.0;
        vector[(primaryBucket + 1) % SemanticFeatureEmbeddingProvider.VECTOR_DIMENSION] += clusterHits * 3.0;
      }
    });

    // 2. Token hashing
    tokens.forEach((token) => {
      if (token.length > 2) {
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
          hash = (hash << 5) - hash + token.charCodeAt(i);
          hash |= 0;
        }
        const pos = Math.abs(hash) % SemanticFeatureEmbeddingProvider.VECTOR_DIMENSION;
        vector[pos] += 0.3;
      }
    });

    // 3. L2 Normalize the vector
    let magnitude = 0;
    for (let i = 0; i < vector.length; i++) {
      magnitude += vector[i] * vector[i];
    }
    magnitude = Math.sqrt(magnitude);

    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] = Math.round((vector[i] / magnitude) * 10000) / 10000;
      }
    }

    return vector;
  }
}
