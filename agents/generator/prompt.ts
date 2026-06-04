export function buildGeneratorPrompt(testPlanContent: string, sourceContext: Record<string, string>): string {
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
11. FULL API PATH IS MANDATORY — always prefix with /web/index.php:
    WRONG: /api/v2/pim/employees
    CORRECT: /web/index.php/api/v2/pim/employees
    This applies to every single API call, no exceptions.
12. response.status DOES NOT EXIST on parsed responses — RequestUtil returns parsed JSON directly.
    NEVER do: expect(response.status).toBe(200)
    If 200 is needed: RequestUtil.assertOk() already throws on non-200. No need to assert status.
    For negative tests needing status: use raw authenticatedApi + RequestUtil.buildPath manually, 
    OR add a new method to RequestUtil that returns raw response.

13. NEVER use authenticatedApi directly in tests — always use RequestUtil which handles 
    cookie injection via buildPath. Direct authenticatedApi calls bypass cookie auth.

14. employeeId CANNOT be set via POST /pim/employees body — OrangeHRM ignores it.
    Remove employeeId from POST payload entirely.

15. DELETE endpoint for PIM employees:
    METHOD: DELETE (not POST)
    URL: /web/index.php/api/v2/pim/employees
    BODY: { ids: [empNumber] }
    Use RequestUtil.delete() — but it needs body support.

16. PUT personal details correct endpoint:
    PUT /web/index.php/api/v2/pim/employees/{empNumber}/personal-details
    NOT: PUT /web/index.php/api/v2/pim/employees/{empNumber}

17. Non-existent employee DELETE returns 404, not 200.
    OrangeHRM does NOT return 200 for batch delete of non-existent IDs.

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
