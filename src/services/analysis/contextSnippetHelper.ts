export function generateCodeContextSnippet(
  sourceCode: string,
  targetLine: number,
  contextRadius = 4
): {
  startLine: number;
  lines: {
    lineNumber: number;
    code: string;
    isHighlighted?: boolean;
  }[];
} {
  const allLines = sourceCode.split('\n');
  const total = allLines.length;

  const start = Math.max(1, targetLine - contextRadius);
  const end = Math.min(total, targetLine + contextRadius);

  const lines = [];
  for (let i = start; i <= end; i++) {
    lines.push({
      lineNumber: i,
      code: allLines[i - 1] ?? '',
      isHighlighted: i === targetLine,
    });
  }

  return {
    startLine: start,
    lines,
  };
}
