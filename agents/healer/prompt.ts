export function buildHealerPrompt(
  specContent:   string,
  errorReport:   string,
  sourceContext: Record<string, string>,
  groundTruth:   Record<string, string>
): string {

  const sourceFiles = Object.entries(sourceContext)
    .map(([p, c]) => `### ${p}\n\`\`\`typescript\n${c}\n\`\`\``)
    .join('\n\n');

  const contextFiles = Object.entries(groundTruth)
    .map(([name, content]) => `### ${name}\n${content}`)
    .join('\n\n');

  return `
You are a Senior QA Automation Engineer. Your task is to fix a failing Playwright TypeScript test file.

## KNOWN ISSUES TO FIX — CHECK ALL OF THESE

1. **POM fixtures use unauthenticated page** — \`addEmployeePage\` and \`employeeListPage\` in pom.fixture.ts
   use \`page\` (unauthenticated). For pages that require login, instantiate page objects
   with \`authenticatedPage\` directly inside the test instead:
   \`\`\`typescript
   // WRONG
   async ({ addEmployeePage }) => { await addEmployeePage.navigate(); }
   
   // CORRECT
   async ({ authenticatedPage }) => {
     const addPage = new AddEmployeePage(authenticatedPage);
     await addPage.navigate();
   }
   \`\`\`

2. **Wrong DB column name** — \`emp_middlename\` does not exist. Use \`emp_middle_name\`

3. **Wrong teardown method** — use \`seed.cleanupEmployeeByEmpNumber(empNumber)\` 
   NOT \`seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString())\`

4. **Private member access** — \`employeeListPage.searchButton\` is private.
   Use \`employeeListPage.searchByName(name)\` instead.

5. **OrangeHRM does NOT use native browser dialogs** — it uses custom Vue modals.
   Replace \`page.once('dialog', ...)\` with:
   \`\`\`typescript
   await authenticatedPage.getByRole('button', { name: 'Yes, Delete' }).click();
   \`\`\`

6. **getRecordCount() returns Promise** — use:
   \`\`\`typescript
   expect(await employeeListPage.getRecordCount()).toBe(1);
   \`\`\`
   NOT: \`await expect(employeeListPage.getRecordCount()).resolves.toBe(1)\`

7. **interceptor.startCapturing must be called BEFORE the UI action** — not after fill, not after navigate.

8. **All API paths must be full paths**:
   WRONG: \`/api/v2/pim/employees\`
   CORRECT: \`/web/index.php/api/v2/pim/employees\`

9. **lastName and firstName max 30 chars** — never use dynamic factory-generated long strings as field values.
   Use short fixed strings like \`'Smith'\` or \`'Doe'\`.

10. **HTTP 200 for all operations** — never expect 201 or 204.

## GROUND TRUTH

${contextFiles}

## ACTUAL SOURCE FILES

${sourceFiles}

## FAILING TEST FILE TO FIX

\`\`\`typescript
${specContent}
\`\`\`

## ERROR REPORT

${errorReport}

## OUTPUT INSTRUCTIONS

Return ONLY the complete fixed TypeScript file content.
- No explanations
- No markdown code fences
- No prose before or after
- The entire file, fully corrected
- Every fix from the KNOWN ISSUES list must be applied
`.trim();
}