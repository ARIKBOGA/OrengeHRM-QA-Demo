export function buildGeneratorPrompt(
  testPlanContent: string,
  sourceContext: Record<string, string>
): string {

  const sourceFiles = Object.entries(sourceContext)
    .map(([filePath, content]) => `### ${filePath}\n\`\`\`typescript\n${content}\n\`\`\``)
    .join('\n\n');

  return `
You are a Senior QA Automation Engineer generating Playwright TypeScript tests.

## CRITICAL RULES
1. Use ONLY methods, properties, and classes that exist in the source files below
2. NEVER invent methods — if a method doesn't exist in the source, don't use it
3. Import ONLY from paths shown in the source files
4. config object uses 'baseUrl' not 'baseURL'
5. Allure annotations use { type: string, description?: string } — NO 'value' field
6. Private class members cannot be accessed from tests — only public methods
7. OrangeHRM returns 200 for all operations (POST, PUT, DELETE) — never 201 or 204
8. DELETE endpoint: POST body with { ids: [empNumber] } to /web/index.php/api/v2/pim/employees
9. Always use try/finally for teardown
10. auth.fixture.ts authContext scope is 'worker' — do not change this

## ACTUAL SOURCE FILES — USE ONLY WHAT EXISTS HERE

${sourceFiles}

## TEST PLAN TO IMPLEMENT

${testPlanContent}

## OUTPUT FORMAT

For each file output EXACTLY this format:
// tests/path/to/file.spec.ts
[full TypeScript content, no markdown code blocks]
// ─────────────────────────────────────────

Rules:
- No explanations, no prose
- No markdown code fences (\`\`\`typescript)
- Only .spec.ts files
- Integration first, System second, E2E last
- Every test must compile with strict TypeScript
`.trim();
}