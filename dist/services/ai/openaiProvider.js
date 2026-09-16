"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const reviewPrompt_1 = require("./prompts/reviewPrompt");
const optimizationPrompt_1 = require("./prompts/optimizationPrompt");
const env_1 = require("../../config/env");
const contextSnippetHelper_1 = require("../analysis/contextSnippetHelper");
class OpenAIProvider {
    name = 'OpenAI';
    apiKey;
    model;
    constructor() {
        this.apiKey = env_1.env.OPENAI_API_KEY || '';
        this.model = 'gpt-4o-mini';
    }
    isAvailable() {
        return Boolean(this.apiKey && this.apiKey.trim().length > 5);
    }
    async analyzeCode(request) {
        if (!this.isAvailable()) {
            throw new Error('OpenAI API key is not configured.');
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        try {
            let historicalRulesText = 'None retrieved.';
            if (request.historicalRules && request.historicalRules.length > 0) {
                historicalRulesText = request.historicalRules
                    .map((r, i) => `${i + 1}. [Rule ID: ${r.ruleId} | Category: ${r.type.toUpperCase()}] ${r.description}`)
                    .join('\n');
            }
            const userPrompt = `
Language: ${request.language}
Filename: ${request.fileName}

=== UNTRUSTED SOURCE CODE TO ANALYZE ===
\`\`\`${request.language}
${request.sourceCode}
\`\`\`

=== HISTORICAL ENGINEERING MEMORY / GROUNDED REFERENCE RULES ===
${historicalRulesText}

IMPORTANT: If any issue corresponds directly to a historical rule listed above, set "historicalMatch": true, "historicalRuleId": "<ruleId>", and "historicalSimilarity": <0.0-1.0>. If no historical rule applies, leave them undefined or false.
`;
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: reviewPrompt_1.SYSTEM_REVIEW_PROMPT },
                        { role: 'user', content: userPrompt },
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.2,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
            }
            const json = await response.json();
            const rawContent = json.choices?.[0]?.message?.content;
            if (!rawContent) {
                throw new Error('Empty response from OpenAI.');
            }
            const parsedJson = JSON.parse(rawContent);
            const validated = reviewPrompt_1.aiResponseSchema.parse(parsedJson);
            const findings = validated.findings.map((f, idx) => ({
                id: `ai-${request.language}-${f.lineStart}-${idx}`,
                category: f.category,
                severity: f.severity,
                title: f.title,
                description: f.description,
                lineStart: f.lineStart,
                lineEnd: f.lineEnd,
                codeSnippet: f.codeSnippet,
                whyItMatters: f.whyItMatters,
                suggestedFix: f.suggestedFix,
                confidence: f.confidence,
                historicalRuleId: f.historicalRuleId,
                historicalMatch: f.historicalMatch ?? false,
                historicalSimilarity: f.historicalSimilarity,
                historicalMatchPercent: f.historicalSimilarity ? Math.round(f.historicalSimilarity * 100) : undefined,
                codeContextSnippet: (0, contextSnippetHelper_1.generateCodeContextSnippet)(request.sourceCode, f.lineStart),
            }));
            return {
                summary: validated.summary,
                findings,
                metrics: validated.metrics,
                modelUsed: this.model,
            };
        }
        catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }
    async optimizeCode(request) {
        if (!this.isAvailable()) {
            throw new Error('OpenAI API key is not configured.');
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        try {
            const findingsSummary = request.staticFindings && request.staticFindings.length > 0
                ? request.staticFindings.map((f) => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`).join('\n')
                : 'None detected.';
            const historicalRulesSummary = request.historicalRules && request.historicalRules.length > 0
                ? request.historicalRules.map((r) => `- [${r.type.toUpperCase()}] ${r.description}`).join('\n')
                : 'None active.';
            const dnaWeaknessesSummary = request.dnaWeaknesses && request.dnaWeaknesses.length > 0
                ? request.dnaWeaknesses.join(', ')
                : 'None identified.';
            const userPrompt = `
Language: ${request.language}
File: ${request.fileName}

=== UNTRUSTED ORIGINAL SOURCE CODE ===
\`\`\`${request.language}
${request.originalCode}
\`\`\`

=== DETECTED STATIC VULNERABILITIES & CODE SMELLS ===
${findingsSummary}

=== INSTITUTIONAL HISTORICAL RULES ===
${historicalRulesSummary}

=== DEVELOPER CODE DNA RECURRING WEAKNESSES ===
${dnaWeaknessesSummary}

Produce an optimized, hardened refactoring that addresses these concerns without executing code.
Return raw JSON matching the schema.
`;
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: optimizationPrompt_1.SYSTEM_OPTIMIZATION_PROMPT },
                        { role: 'user', content: userPrompt },
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.2,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenAI optimization error (${response.status}): ${errorText}`);
            }
            const json = await response.json();
            const rawContent = json.choices?.[0]?.message?.content;
            if (!rawContent) {
                throw new Error('Empty response from OpenAI optimization.');
            }
            const parsedJson = JSON.parse(rawContent);
            const validated = optimizationPrompt_1.aiOptimizationResponseSchema.parse(parsedJson);
            return {
                optimizedCode: validated.optimizedCode,
                summary: validated.summary,
                changes: validated.changes,
                modelUsed: this.model,
            };
        }
        catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }
    async evaluateDefense(request) {
        if (!this.isAvailable()) {
            throw new Error('OpenAI API key is not configured.');
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
            const userPrompt = `
Evaluate Developer's Defense Reasoning:
"${request.defenseReasoning}"

Original Implementation:
\`\`\`${request.language || 'text'}
${request.originalCode || 'N/A'}
\`\`\`

AI Optimized Implementation:
\`\`\`${request.language || 'text'}
${request.optimizedCode || 'N/A'}
\`\`\`

Return JSON object:
{
  "evaluation": "<constructive evaluation of developer's engineering arguments>",
  "pointsAwarded": <number 25-100 based on technical merit>
}
`;
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are CodeDNA Senior Engineering Judge evaluating a developer defense in Code Battle. Return JSON only.',
                        },
                        { role: 'user', content: userPrompt },
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.3,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error('OpenAI defense evaluation failed.');
            }
            const json = await response.json();
            const raw = json.choices?.[0]?.message?.content;
            const parsed = JSON.parse(raw);
            return {
                evaluation: parsed.evaluation || 'Defense argument assessed.',
                pointsAwarded: Math.min(100, Math.max(25, parsed.pointsAwarded || 50)),
            };
        }
        catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=openaiProvider.js.map