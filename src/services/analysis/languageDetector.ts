import { SupportedLanguage } from './analyzer.interface';

/**
 * Strips comments and string literals so language syntax signature detection
 * operates purely on actual code structure rather than text inside strings or comments.
 */
export function stripCommentsAndStrings(code: string): string {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inTripleDouble = false;
  let inTripleSingle = false;
  let inSingleLineComment = false;
  let inMultiLineComment = false;

  const chars = code.split('');
  const n = chars.length;
  const result: string[] = [];

  let i = 0;
  while (i < n) {
    const ch = chars[i];
    const next = i + 1 < n ? chars[i + 1] : '';
    const next2 = i + 2 < n ? chars[i + 2] : '';

    // Handle escaped characters inside strings
    if (ch === '\\' && (inSingleQuote || inDoubleQuote || inBacktick)) {
      result.push(' ', ' ');
      i += 2;
      continue;
    }

    // Inside single-line comment (//, #, --)
    if (inSingleLineComment) {
      if (ch === '\n' || ch === '\r') {
        inSingleLineComment = false;
        result.push(ch);
      } else {
        result.push(' ');
      }
      i++;
      continue;
    }

    // Inside multi-line comment (/* ... */)
    if (inMultiLineComment) {
      if (ch === '*' && next === '/') {
        inMultiLineComment = false;
        result.push(' ', ' ');
        i += 2;
      } else {
        result.push(ch === '\n' ? '\n' : ' ');
        i++;
      }
      continue;
    }

    // Inside Python triple double quotes """ ... """
    if (inTripleDouble) {
      if (ch === '"' && next === '"' && next2 === '"') {
        inTripleDouble = false;
        result.push(' ', ' ', ' ');
        i += 3;
      } else {
        result.push(ch === '\n' ? '\n' : ' ');
        i++;
      }
      continue;
    }

    // Inside Python triple single quotes ''' ... '''
    if (inTripleSingle) {
      if (ch === "'" && next === "'" && next2 === "'") {
        inTripleSingle = false;
        result.push(' ', ' ', ' ');
        i += 3;
      } else {
        result.push(ch === '\n' ? '\n' : ' ');
        i++;
      }
      continue;
    }

    // Inside single-quoted string
    if (inSingleQuote) {
      if (ch === "'") {
        inSingleQuote = false;
      }
      result.push(' ');
      i++;
      continue;
    }

    // Inside double-quoted string
    if (inDoubleQuote) {
      if (ch === '"') {
        inDoubleQuote = false;
      }
      result.push(' ');
      i++;
      continue;
    }

    // Inside template literal (backtick)
    if (inBacktick) {
      if (ch === '`') {
        inBacktick = false;
      }
      result.push(ch === '\n' ? '\n' : ' ');
      i++;
      continue;
    }

    // Check start of triple double
    if (ch === '"' && next === '"' && next2 === '"') {
      inTripleDouble = true;
      result.push(' ', ' ', ' ');
      i += 3;
      continue;
    }

    // Check start of triple single
    if (ch === "'" && next === "'" && next2 === "'") {
      inTripleSingle = true;
      result.push(' ', ' ', ' ');
      i += 3;
      continue;
    }

    // Check start of //
    if (ch === '/' && next === '/') {
      inSingleLineComment = true;
      result.push(' ', ' ');
      i += 2;
      continue;
    }

    // Check start of /*
    if (ch === '/' && next === '*') {
      inMultiLineComment = true;
      result.push(' ', ' ');
      i += 2;
      continue;
    }

    // Check start of -- (SQL comment)
    if (ch === '-' && next === '-') {
      inSingleLineComment = true;
      result.push(' ', ' ');
      i += 2;
      continue;
    }

    // Check start of #
    if (ch === '#') {
      const rest = code.slice(i, i + 12);
      if (/^#(?:include|define|pragma|ifndef|ifdef|endif|undef)/.test(rest)) {
        // C/C++ preprocessor directive
        result.push(ch);
        i++;
        continue;
      } else {
        inSingleLineComment = true;
        result.push(' ');
        i++;
        continue;
      }
    }

    // Check string starts
    if (ch === "'") {
      inSingleQuote = true;
      result.push(' ');
      i++;
      continue;
    }
    if (ch === '"') {
      inDoubleQuote = true;
      result.push(' ');
      i++;
      continue;
    }
    if (ch === '`') {
      inBacktick = true;
      result.push(' ');
      i++;
      continue;
    }

    result.push(ch);
    i++;
  }

  return result.join('');
}

export class LanguageDetector {
  private static readonly SUPPORTED_LANGUAGES: Record<string, SupportedLanguage> = {
    javascript: 'javascript',
    js: 'javascript',
    jsx: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    tsx: 'typescript',
    python: 'python',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    'c++': 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    c: 'c',
    go: 'go',
    golang: 'go',
    rust: 'rust',
    rs: 'rust',
    php: 'php',
    sql: 'sql',
    pgsql: 'sql',
    mysql: 'sql',
  };

  private static readonly DISPLAY_NAMES: Record<SupportedLanguage, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    go: 'Go',
    rust: 'Rust',
    php: 'PHP',
    sql: 'SQL',
  };

  static normalizeLanguage(input: string): SupportedLanguage | null {
    if (!input) return null;
    const clean = input.trim().toLowerCase();
    return this.SUPPORTED_LANGUAGES[clean] || null;
  }

  static getDisplayName(lang: SupportedLanguage): string {
    return this.DISPLAY_NAMES[lang] || lang;
  }

  static getSupportedLanguagesList(): string[] {
    return [
      'javascript',
      'typescript',
      'python',
      'java',
      'cpp',
      'c',
      'go',
      'rust',
      'php',
      'sql',
    ];
  }

  /**
   * Evaluates source code structure against syntax signatures of supported languages.
   * Comments and string literals are stripped first to avoid false positives.
   */
  static validateLanguageWithCode(
    selectedLanguage: SupportedLanguage,
    sourceCode: string
  ): { isValid: boolean; warning?: string; suggestedLanguage?: SupportedLanguage } {
    const stripped = stripCommentsAndStrings(sourceCode).trim();
    if (!stripped) {
      return { isValid: true };
    }

    // Calculate deterministic syntax evidence scores for each language family
    let pythonScore = 0;
    if (/\bdef\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*:/.test(stripped)) pythonScore += 3;
    if (/\bclass\s+[a-zA-Z_]\w*(\s*\([^)]*\))?\s*:/.test(stripped)) pythonScore += 3;
    if (/\belif\b/.test(stripped)) pythonScore += 3;
    if (/\bself\.\w+/.test(stripped)) pythonScore += 2;
    if (/\bfrom\s+[a-zA-Z_]\w*\s+import\s+[a-zA-Z_]\w+/.test(stripped)) pythonScore += 3;
    if (/\bimport\s+[a-zA-Z_]\w+(\s+as\s+\w+)?\s*(?:$|\n)/m.test(stripped)) pythonScore += 2;
    if (/\bexcept(\s+[a-zA-Z_]\w*)?(\s+as\s+\w+)?\s*:/.test(stripped)) pythonScore += 3;
    if (/\b(?:None|True|False)\b/.test(stripped)) pythonScore += 1;
    if (/\bpass\b/.test(stripped)) pythonScore += 2;

    let jsTsScore = 0;
    if (/\b(?:const|let|var)\s+[a-zA-Z_$]\w*\s*=/.test(stripped)) jsTsScore += 3;
    if (/\bfunction\s*[a-zA-Z_$]*\s*\([^)]*\)\s*\{/.test(stripped)) jsTsScore += 3;
    if (/=>\s*\{?/.test(stripped)) jsTsScore += 3;
    if (/console\.(?:log|error|warn|info)\s*\(/.test(stripped)) jsTsScore += 3;
    if (/\b(?:export\s+default|module\.exports\s*=|require\s*\()/.test(stripped)) jsTsScore += 3;
    if (/\bimport\s+.*?\s+from\s+/.test(stripped)) jsTsScore += 2;
    if (/===|!==/.test(stripped)) jsTsScore += 2;

    let sqlScore = 0;
    if (/\bSELECT\s+.*?\s+FROM\b/i.test(stripped)) sqlScore += 4;
    if (/\bINSERT\s+INTO\s+.*?\s+VALUES\b/i.test(stripped)) sqlScore += 4;
    if (/\bUPDATE\s+.*?\s+SET\b/i.test(stripped)) sqlScore += 4;
    if (/\bDELETE\s+FROM\b/i.test(stripped)) sqlScore += 4;
    if (/\bCREATE\s+TABLE\b/i.test(stripped)) sqlScore += 4;
    if (/\bALTER\s+TABLE\b|\bDROP\s+TABLE\b/i.test(stripped)) sqlScore += 4;

    let javaScore = 0;
    if (/public\s+static\s+void\s+main\s*\(/.test(stripped)) javaScore += 5;
    if (/System\.out\.(?:println|print)\s*\(/.test(stripped)) javaScore += 4;
    if (/public\s+(?:class|interface|enum)\s+[a-zA-Z_]\w*/.test(stripped)) javaScore += 3;
    if (/package\s+[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*\s*;/.test(stripped)) javaScore += 3;
    if (/@Override\b/.test(stripped)) javaScore += 2;

    let goScore = 0;
    if (/^package\s+[a-zA-Z_]\w*/m.test(stripped)) goScore += 3;
    if (/func\s+(?:\([^)]+\)\s+)?[a-zA-Z_]\w*\s*\([^)]*\)/.test(stripped)) goScore += 3;
    if (/:=/.test(stripped)) goScore += 2;
    if (/fmt\.(?:Println|Printf|Print|Sprintf)\b/.test(stripped)) goScore += 3;

    let rustScore = 0;
    if (/fn\s+[a-zA-Z_]\w*\s*\([^)]*\)/.test(stripped)) rustScore += 3;
    if (/let\s+mut\s+/.test(stripped)) rustScore += 3;
    if (/impl\s+[a-zA-Z_]\w*/.test(stripped)) rustScore += 3;
    if (/println!\s*\(|format!\s*\(/.test(stripped)) rustScore += 3;

    let cppScore = 0;
    if (/#include\s*<[a-zA-Z0-9_./]+>/.test(stripped)) cppScore += 4;
    if (/std::|cout\s*<<|cin\s*>>/.test(stripped)) cppScore += 4;
    if (/int\s+main\s*\(\s*(?:void|int\s+argc)?/.test(stripped)) cppScore += 3;
    if (/printf\s*\(|scanf\s*\(/.test(stripped)) cppScore += 2;

    let phpScore = 0;
    if (/<\?php|\?>/.test(stripped)) phpScore += 5;
    if (/\$[a-zA-Z_]\w*\s*=/.test(stripped)) phpScore += 3;
    if (/echo\s+/.test(stripped)) phpScore += 2;

    // Consistency checks per selected language

    // 1. Python selected
    if (selectedLanguage === 'python') {
      if (pythonScore === 0) {
        if (jsTsScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'javascript',
            warning: 'Selected language does not match the submitted source code. Selected: Python. Detected: JavaScript.',
          };
        }
        if (sqlScore >= 4) {
          return {
            isValid: false,
            suggestedLanguage: 'sql',
            warning: 'Selected language does not match the submitted source code. Selected: Python. Detected: SQL.',
          };
        }
        if (javaScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'java',
            warning: 'Selected language does not match the submitted source code. Selected: Python. Detected: Java.',
          };
        }
        if (goScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'go',
            warning: 'Selected language does not match the submitted source code. Selected: Python. Detected: Go.',
          };
        }
        if (rustScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'rust',
            warning: 'Selected language does not match the submitted source code. Selected: Python. Detected: Rust.',
          };
        }
        if (cppScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'cpp',
            warning: 'Selected language does not match the submitted source code. Selected: Python. Detected: C++.',
          };
        }
        if (phpScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'php',
            warning: 'Selected language does not match the submitted source code. Selected: Python. Detected: PHP.',
          };
        }
      }
    }

    // 2. JavaScript / TypeScript selected
    if (selectedLanguage === 'javascript' || selectedLanguage === 'typescript') {
      if (jsTsScore === 0) {
        if (pythonScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'python',
            warning: `Selected language does not match the submitted source code. Selected: ${this.getDisplayName(selectedLanguage)}. Detected: Python.`,
          };
        }
        if (sqlScore >= 4) {
          return {
            isValid: false,
            suggestedLanguage: 'sql',
            warning: `Selected language does not match the submitted source code. Selected: ${this.getDisplayName(selectedLanguage)}. Detected: SQL.`,
          };
        }
        if (javaScore >= 4) {
          return {
            isValid: false,
            suggestedLanguage: 'java',
            warning: `Selected language does not match the submitted source code. Selected: ${this.getDisplayName(selectedLanguage)}. Detected: Java.`,
          };
        }
        if (goScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'go',
            warning: `Selected language does not match the submitted source code. Selected: ${this.getDisplayName(selectedLanguage)}. Detected: Go.`,
          };
        }
        if (rustScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'rust',
            warning: `Selected language does not match the submitted source code. Selected: ${this.getDisplayName(selectedLanguage)}. Detected: Rust.`,
          };
        }
        if (cppScore >= 4) {
          return {
            isValid: false,
            suggestedLanguage: 'cpp',
            warning: `Selected language does not match the submitted source code. Selected: ${this.getDisplayName(selectedLanguage)}. Detected: C++.`,
          };
        }
        if (phpScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'php',
            warning: `Selected language does not match the submitted source code. Selected: ${this.getDisplayName(selectedLanguage)}. Detected: PHP.`,
          };
        }
      }
    }

    // 3. SQL selected
    if (selectedLanguage === 'sql') {
      if (sqlScore === 0) {
        if (pythonScore >= 2) {
          return {
            isValid: false,
            suggestedLanguage: 'python',
            warning: 'Selected language does not match the submitted source code. Selected: SQL. Detected: Python.',
          };
        }
        if (jsTsScore >= 2) {
          return {
            isValid: false,
            suggestedLanguage: 'javascript',
            warning: 'Selected language does not match the submitted source code. Selected: SQL. Detected: JavaScript.',
          };
        }
        if (javaScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'java',
            warning: 'Selected language does not match the submitted source code. Selected: SQL. Detected: Java.',
          };
        }
        if (goScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'go',
            warning: 'Selected language does not match the submitted source code. Selected: SQL. Detected: Go.',
          };
        }
        if (rustScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'rust',
            warning: 'Selected language does not match the submitted source code. Selected: SQL. Detected: Rust.',
          };
        }
        if (cppScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'cpp',
            warning: 'Selected language does not match the submitted source code. Selected: SQL. Detected: C++.',
          };
        }
        if (phpScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'php',
            warning: 'Selected language does not match the submitted source code. Selected: SQL. Detected: PHP.',
          };
        }
        // General non-SQL check if general programming constructs are present
        if (/\b(?:function|def|class|const|let|var|package)\b/.test(stripped)) {
          return {
            isValid: false,
            warning: 'Code does not appear to contain SQL query or DDL statements.',
          };
        }
      }
    }

    // 4. Java selected
    if (selectedLanguage === 'java') {
      if (javaScore === 0) {
        if (pythonScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'python',
            warning: 'Selected language does not match the submitted source code. Selected: Java. Detected: Python.',
          };
        }
        if (jsTsScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'javascript',
            warning: 'Selected language does not match the submitted source code. Selected: Java. Detected: JavaScript.',
          };
        }
        if (sqlScore >= 4) {
          return {
            isValid: false,
            suggestedLanguage: 'sql',
            warning: 'Selected language does not match the submitted source code. Selected: Java. Detected: SQL.',
          };
        }
      }
    }

    // 5. C or C++ selected
    if (selectedLanguage === 'cpp' || selectedLanguage === 'c') {
      if (cppScore === 0) {
        if (pythonScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'python',
            warning: `Selected language does not match the submitted source code. Selected: ${this.getDisplayName(selectedLanguage)}. Detected: Python.`,
          };
        }
        if (jsTsScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'javascript',
            warning: `Selected language does not match the submitted source code. Selected: ${this.getDisplayName(selectedLanguage)}. Detected: JavaScript.`,
          };
        }
        if (sqlScore >= 4) {
          return {
            isValid: false,
            suggestedLanguage: 'sql',
            warning: `Selected language does not match the submitted source code. Selected: ${this.getDisplayName(selectedLanguage)}. Detected: SQL.`,
          };
        }
      }
    }

    // 6. Go selected
    if (selectedLanguage === 'go') {
      if (goScore === 0) {
        if (pythonScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'python',
            warning: 'Selected language does not match the submitted source code. Selected: Go. Detected: Python.',
          };
        }
        if (jsTsScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'javascript',
            warning: 'Selected language does not match the submitted source code. Selected: Go. Detected: JavaScript.',
          };
        }
        if (sqlScore >= 4) {
          return {
            isValid: false,
            suggestedLanguage: 'sql',
            warning: 'Selected language does not match the submitted source code. Selected: Go. Detected: SQL.',
          };
        }
      }
    }

    // 7. Rust selected
    if (selectedLanguage === 'rust') {
      if (rustScore === 0) {
        if (pythonScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'python',
            warning: 'Selected language does not match the submitted source code. Selected: Rust. Detected: Python.',
          };
        }
        if (jsTsScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'javascript',
            warning: 'Selected language does not match the submitted source code. Selected: Rust. Detected: JavaScript.',
          };
        }
        if (sqlScore >= 4) {
          return {
            isValid: false,
            suggestedLanguage: 'sql',
            warning: 'Selected language does not match the submitted source code. Selected: Rust. Detected: SQL.',
          };
        }
      }
    }

    // 8. PHP selected
    if (selectedLanguage === 'php') {
      if (phpScore === 0) {
        if (pythonScore >= 3) {
          return {
            isValid: false,
            suggestedLanguage: 'python',
            warning: 'Selected language does not match the submitted source code. Selected: PHP. Detected: Python.',
          };
        }
        if (sqlScore >= 4) {
          return {
            isValid: false,
            suggestedLanguage: 'sql',
            warning: 'Selected language does not match the submitted source code. Selected: PHP. Detected: SQL.',
          };
        }
      }
    }

    return { isValid: true };
  }
}

