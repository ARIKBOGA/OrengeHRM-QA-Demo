export function buildPlannerPrompt(issueTitle: string, issueBody: string): string {
  return `
You are a Senior QA Engineer working on OrangeHRM — an open source HR management system.
Generate a detailed, structured test plan for the GitHub Issue below.

## GitHub Issue
**Title:** ${issueTitle}
**Body:**
${issueBody}

## Output Format (Markdown)
1. **Summary** — what is being tested and why
2. **Scope** — in scope / out of scope
3. **Test Layers** — breakdown by Integration, System, E2E
4. **Test Cases** — for each: ID, title, preconditions, steps, expected result, layer
5. **Risks** — edge cases and failure scenarios
6. **Exit Criteria** — sign-off conditions

Be specific to OrangeHRM modules: PIM (employees), Leave, Recruitment, Admin, Time.
Reference Playwright + TypeScript as the automation stack.
  `.trim();
}
