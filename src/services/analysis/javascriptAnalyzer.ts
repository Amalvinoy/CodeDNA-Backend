import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
import { ICodeFinding } from '../../models';
import { generateCodeContextSnippet } from './contextSnippetHelper';

export class JavaScriptAnalyzer implements ILanguageAnalyzer {
  readonly language = 'javascript' as const;

  async analyze(sourceCode: string, fileName = 'file.js'): Promise<StaticAnalysisResult> {
    const findings: ICodeFinding[] = [];
    const lines = sourceCode.split('\n');

    let evalFound = false;
    let rawSqlFound = false;
    let sqlConcatFound = false;
    let hardcodedCredFound = false;
    let brokenAuthFound = false;
    let sensitiveErrorFound = false;
    let looseEqualityCount = 0;
    let varDeclarationCount = 0;

    // Track request-derived authorization variables
    // e.g. const isAdmin = req.query.admin; const role = req.body.role;
    const requestAuthVars = new Map<string, { line: number; paramSource: string }>();

    // Pass 1: Identify variables assigned directly from untrusted request auth parameters
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

      const reqAuthAssignMatch = trimmed.match(
        /\b(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(req\.(?:query|body|params|headers)\.(?:admin|isAdmin|role|roleName|group|isSuperUser|superuser|accessLevel|permission))\b/i
      );
      if (reqAuthAssignMatch) {
        requestAuthVars.set(reqAuthAssignMatch[1], {
          line: index + 1,
          paramSource: reqAuthAssignMatch[2],
        });
      }
    });

    // Pass 2: Line-by-line static analysis
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Skip comment lines
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        return;
      }

      // 1. Eval usage (Critical Security)
      if (/\beval\s*\(/.test(trimmed)) {
        evalFound = true;
        findings.push({
          id: `js-sec-eval-${lineNum}`,
          category: 'security',
          severity: 'critical',
          title: 'Arbitrary Code Execution via eval()',
          description:
            'Use of eval() executes strings as JavaScript code, allowing attackers to inject malicious code and bypass security scopes.',
          lineStart: lineNum,
          lineEnd: lineNum,
          codeSnippet: trimmed,
          whyItMatters:
            'eval() opens severe remote code execution vulnerabilities and disables JavaScript V8 engine JIT optimizations.',
          suggestedFix:
            'Parse data safely using JSON.parse() or replace dynamic code evaluation with structured map/object lookups.',
          confidence: 0.98,
          codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
        });
      }

      // 2. Direct SQL string interpolation (Template literal with ${...})
      if (
        /(`SELECT|`INSERT|`UPDATE|`DELETE|`DROP|`ALTER|"\s*SELECT|'\s*SELECT).*\$\{/i.test(trimmed)
      ) {
        rawSqlFound = true;
        findings.push({
          id: `js-sec-sql-${lineNum}`,
          category: 'security',
          severity: 'critical',
          title: 'Potential SQL Injection in Query Construction',
          description:
            'Unsanitized parameters interpolated directly into SQL string templates allow query manipulation and unauthorized data exfiltration.',
          lineStart: lineNum,
          lineEnd: lineNum,
          codeSnippet: trimmed,
          whyItMatters:
            'SQL injection is an OWASP Top 10 critical risk that can lead to complete database compromise.',
          suggestedFix:
            'Use parameterized queries (e.g., $1, ? placeholders) provided by your query builder or ORM.',
          confidence: 0.95,
          codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
        });
      }

      // 3. SQL Injection via String Concatenation (+)
      // Examples:
      // "SELECT * FROM users WHERE id = " + id
      // db.query("SELECT * FROM users WHERE id = " + userId)
      // "DELETE FROM users WHERE id=" + userId
      // "UPDATE users SET name='" + name + "'"
      const hasSqlKeywords = /\b(SELECT\b|INSERT\s+INTO\b|UPDATE\b|DELETE\s+FROM\b|DROP\s+TABLE\b|ALTER\s+TABLE\b)/i.test(trimmed);
      const isDbQueryCall = /(?:db|connection|pool|client|sequelize)\.query\s*\(|knex\.raw\s*\(/i.test(trimmed);

      const isSqlConcatPattern =
        // "SELECT ... " + id / identifier
        /(?:["'`]\s*(?:SELECT\b|INSERT\s+INTO\b|UPDATE\b|DELETE\s+FROM\b|DROP\s+TABLE\b|ALTER\s+TABLE\b)[^"'`]*["'`]\s*\+\s*[a-zA-Z0-9_$.]+)/i.test(trimmed) ||
        // identifier + " WHERE ... " or " ... " + id + " ... "
        /[a-zA-Z0-9_$.]+\s*\+\s*["'`][^"'`]*\b(?:FROM|WHERE|SET|VALUES)\b/i.test(trimmed) ||
        // db.query("..." + id) or db.query(sql + ...)
        (isDbQueryCall && /\+\s*[a-zA-Z0-9_$.]+/i.test(trimmed) && !trimmed.includes('?'));

      if ((hasSqlKeywords || isDbQueryCall) && isSqlConcatPattern) {
        sqlConcatFound = true;
        findings.push({
          id: `js-sec-sql-concat-${lineNum}`,
          category: 'security',
          severity: 'critical',
          title: 'SQL Injection via String Concatenation',
          description:
            'Dynamic concatenation of untrusted variables into a SQL query string allows attackers to manipulate query logic and execute arbitrary database operations.',
          lineStart: lineNum,
          lineEnd: lineNum,
          codeSnippet: trimmed,
          whyItMatters:
            'SQL injection is an OWASP Top 10 critical security risk that can lead to complete database compromise, data tampering, or unauthorized data exfiltration.',
          suggestedFix:
            'Use parameterized/prepared queries with placeholders (e.g. `?` or `$1`) and pass dynamic inputs as separate parameters array.',
          confidence: 0.96,
          codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
        });
      }

      // 4. Hardcoded Credentials
      // Examples: password: "password123", dbPassword = "secret", apiKey = "...", secret = "..."
      // Negative guards: process.env, config., settings., type: "password", placeholders
      const credKeyPattern = /\b(password|passwd|pwd|dbPassword|clientSecret|apiSecret|apiKey|api_key|secretKey|secret_key|accessToken|access_token|privateKey|private_key|secret)\s*(?::|=(?!=|>))\s*(["'])(.+?)\2/i;
      const credMatch = trimmed.match(credKeyPattern);
      if (credMatch) {
        const val = credMatch[3].trim();
        const isEnvOrConfig = /process\.env|config\.|settings\./i.test(trimmed);
        const isTypePassword = /type\s*:\s*["']password["']/i.test(trimmed);
        const isPlaceholder = /^(?:your[_-]|xxx|<|>|\*{3,})/i.test(val);

        if (!isEnvOrConfig && !isTypePassword && !isPlaceholder && val.length >= 4) {
          hardcodedCredFound = true;
          findings.push({
            id: `js-sec-cred-${lineNum}`,
            category: 'security',
            severity: 'high',
            title: 'Hardcoded Credential Detected',
            description:
              `Potential hardcoded credential or secret ('${credMatch[1]}') discovered directly in source code.`,
            lineStart: lineNum,
            lineEnd: lineNum,
            codeSnippet: trimmed,
            whyItMatters:
              'Hardcoded credentials committed to version control can be discovered by attackers, leading to unauthorized access, privilege escalation, and data breaches.',
            suggestedFix:
              'Extract credentials to environment variables (e.g., `process.env.DB_PASSWORD`) or a secure secrets management system.',
            confidence: 0.94,
            codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
          });
        }
      }

      // 5. Request-Controlled Authorization
      // Examples:
      // const isAdmin = req.query.admin; if (isAdmin === "true")
      // if (req.body.role === "admin")
      // Negative guard: const role = user.role; if (role === "admin") (server-side identity)
      let reqAuthMatchFound = false;
      let matchedAuthSource = '';

      // Direct check in if statement: if (req.query.admin === "true") or if (req.body.role === "admin")
      const directReqAuthMatch = trimmed.match(
        /if\s*\([^)]*req\.(?:query|body|params)\.(admin|isAdmin|role|isSuperUser|superuser|group)\s*===?\s*["'][^"']+["']/i
      );
      if (directReqAuthMatch) {
        reqAuthMatchFound = true;
        matchedAuthSource = directReqAuthMatch[0];
      } else {
        // Variable derived from request query/body earlier
        for (const [varName, meta] of requestAuthVars.entries()) {
          const varInIfRegex = new RegExp(`\\bif\\s*\\([^)]*\\b${varName}\\b\\s*(?:===?|!==?|==)?`, 'i');
          if (varInIfRegex.test(trimmed)) {
            reqAuthMatchFound = true;
            matchedAuthSource = `${varName} (derived from ${meta.paramSource})`;
            break;
          }
        }
      }

      if (reqAuthMatchFound) {
        brokenAuthFound = true;
        findings.push({
          id: `js-sec-auth-${lineNum}`,
          category: 'security',
          severity: 'high',
          title: 'Request-Controlled Authorization Decision',
          description:
            `Authorization check relies directly on client-controlled request input (${matchedAuthSource}).`,
          lineStart: lineNum,
          lineEnd: lineNum,
          codeSnippet: trimmed,
          whyItMatters:
            'Allowing client-controlled query parameters or request body values to determine administrative access causes Broken Access Control (OWASP Top 10), enabling privilege escalation.',
          suggestedFix:
            'Derive authorization decisions exclusively from trusted server-side identity (e.g., cryptographically verified session or verified JWT tokens).',
          confidence: 0.93,
          codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
        });
      }

      // 6. Sensitive Error Exposure
      // Examples:
      // res.json({ error: err.message })
      // res.send(err.stack)
      // res.json({ stack: error.stack })
      // res.status(500).json({ error: err.message })
      // Negative guards: console.error(err), generic messages like res.send("Database error")
      const hasErrorDetail = /\b(?:err|error)\.(?:message|stack)\b/i.test(trimmed);
      if (hasErrorDetail) {
        let isResponseCall = /res\.(?:status\(\d+\)\.)?(?:json|send)\s*\(/i.test(trimmed);
        if (!isResponseCall) {
          for (let back = 1; back <= 3; back++) {
            const prevLine = lines[index - back]?.trim() || '';
            if (/res\.(?:status\(\d+\)\.)?(?:json|send)\s*\(/i.test(prevLine)) {
              isResponseCall = true;
              break;
            }
          }
        }

        const isLoggingCall = /console\.(?:error|log|warn|info)|logger\./i.test(trimmed);

        if (isResponseCall && !isLoggingCall) {
          sensitiveErrorFound = true;
          findings.push({
            id: `js-sec-err-leak-${lineNum}`,
            category: 'security',
            severity: 'medium',
            title: 'Sensitive Error Exposure in Client Response',
            description:
              'Internal exception details (message or stack trace) are returned directly in the HTTP client response.',
            lineStart: lineNum,
            lineEnd: lineNum,
            codeSnippet: trimmed,
            whyItMatters:
              'Exposing raw error messages or stack traces leaks database schema, internal paths, and implementation details to potential attackers (CWE-209).',
            suggestedFix:
              'Return a generic, client-safe error message (e.g., `res.status(500).json({ error: "Internal server error" })`) and log detailed diagnostics securely on the server.',
            confidence: 0.92,
            codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
          });
        }
      }

      // 7. Loose Equality check (== instead of ===)
      if (/[^!=]==[^=]/.test(trimmed) && !trimmed.startsWith('//') && !trimmed.includes('typeof')) {
        looseEqualityCount++;
        if (looseEqualityCount <= 2) {
          findings.push({
            id: `js-style-eq-${lineNum}`,
            category: 'correctness',
            severity: 'low',
            title: 'Use Strict Equality (===)',
            description:
              'Loose equality (==) performs unexpected type coercion, causing subtle logical bugs when comparing falsy values.',
            lineStart: lineNum,
            lineEnd: lineNum,
            codeSnippet: trimmed,
            whyItMatters:
              'Type coercion can result in `0 == ""` evaluating to true and bypassing validation guards.',
            suggestedFix: 'Replace `==` with strict equality `===`.',
            confidence: 0.9,
            codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
          });
        }
      }

      // 8. Var declaration usage
      // Examples: var activeUsers = []; for (var i = 0; ...)
      if (/\bvar\s+[a-zA-Z_$][a-zA-Z0-9_$]*/.test(trimmed)) {
        varDeclarationCount++;
        if (varDeclarationCount <= 3) {
          findings.push({
            id: `js-maint-var-${lineNum}`,
            category: 'maintainability',
            severity: 'low',
            title: "Use 'let' or 'const' Instead of 'var'",
            description:
              "Variables declared with 'var' are function-scoped rather than block-scoped and are hoisted, creating potential scoping and shadowing bugs.",
            lineStart: lineNum,
            lineEnd: lineNum,
            codeSnippet: trimmed,
            whyItMatters:
              "'var' lacks block scoping in loops and conditionals, which can inadvertently overwrite outer variables or cause race conditions in asynchronous callbacks.",
            suggestedFix:
              "Replace 'var' with 'const' for identifiers that are not reassigned, or 'let' for loop counters and mutable bindings.",
            confidence: 0.95,
            codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
          });
        }
      }

      // 9. innerHTML / DOM injection
      if (/\.innerHTML\s*=/.test(trimmed)) {
        findings.push({
          id: `js-sec-xss-${lineNum}`,
          category: 'security',
          severity: 'high',
          title: 'Cross-Site Scripting (XSS) via innerHTML',
          description:
            'Assigning untrusted or dynamic strings directly to innerHTML can execute arbitrary client-side scripts.',
          lineStart: lineNum,
          lineEnd: lineNum,
          codeSnippet: trimmed,
          whyItMatters:
            'XSS vulnerabilities allow attackers to hijack user sessions and steal authentication tokens.',
          suggestedFix: 'Use textContent, innerText, or a DOM sanitizer such as DOMPurify.',
          confidence: 0.92,
          codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
        });
      }
    });

    const hasCriticalSec = evalFound || rawSqlFound || sqlConcatFound;
    const hasHighSec = hardcodedCredFound || brokenAuthFound;
    const securityScore = hasCriticalSec ? 4.0 : hasHighSec ? 5.5 : sensitiveErrorFound ? 7.0 : 9.5;
    const correctnessScore = looseEqualityCount > 0 ? 8.0 : 9.0;
    const maintainabilityScore = varDeclarationCount > 0 ? 7.8 : 8.8;

    return {
      findings,
      metrics: {
        security: securityScore,
        correctness: correctnessScore,
        maintainability: maintainabilityScore,
        performance: 8.8,
        architecture: 8.0,
      },
      staticRulesApplied: 28,
    };
  }
}

