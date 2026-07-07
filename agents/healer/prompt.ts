export function buildHealerPrompt(
  specContent: string,
  errorReport: string,
  sourceContext: Record<string, string>,
  groundTruth: Record<string, string>
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

11. **AddEmployeePage.save() has its own internal waitForResponse** for the same
    /api/v2/pim/employees regex used by an external InterceptorUtil in the test.
    Running both simultaneously causes a race condition and timeout, especially
    when extra fields (e.g. employeeId) are filled. Bypass the internal one:
    \`\`\`typescript
    // WRONG
    await addEmployeePage.save();

    // CORRECT — when an external InterceptorUtil is already capturing
    await authenticatedPage.getByRole('button', { name: 'Save' }).click();
    \`\`\`

12. **Employee Name search is partial/substring match, not exact.** A short
    search term (e.g. a single first name) can match leftover/dirty data from
    other tests (e.g. "Search" matches "IDSearch"). When a test explicitly
    expects an exact-match result count, search by full name instead:
    \`\`\`typescript
    await employeeListPage.searchByName(\`\${employeeData.firstName} \${employeeData.lastName}\`);
    \`\`\`

13. **Employee Name search field is a typeahead/autocomplete component** — \`.fill()\`
    alone does not commit the value to the component's internal model; the search
    silently runs unfiltered (returning the total system record count, which always
    includes at least one permanent employee — the Admin user's own PIM record).
    Always blur/close the dropdown before clicking Search:
    \`\`\`typescript
    await this.employeeNameInput.fill(name);
    await this.employeeNameInput.press('Escape');
    await this.searchButton.click();
    \`\`\`
   
14. **getRecordCount() must count actual table rows, not parse a "(N) Records Found"
    text label.** That text component is unreliable at zero-result state (may not
    update, or may reflect an unrelated counter) and produced consistent false
    positives. Always count real DOM rows:
    \`\`\`typescript
    async getRecordCount(): Promise<number> {
      return this.tableRows.count();
    }
    \`\`\`
    Correspondingly, do not assert on a "No Records Found" text label being visible —
    it may not render reliably in this app version. Assert \`getRecordCount() === 0\`
    instead, which is sufficient proof of an empty result set.

15. **OrangeHRM shows "No Records Found" in TWO places simultaneously** on an empty
    search result: a persistent <span> in the table area, and a transient toast
    <p> notification. A page-wide getByText('No Records Found') causes a strict
    mode violation. Scope to the span specifically:
    \`\`\`typescript
    await expect(
      page.locator('span.oxd-text--span').filter({ hasText: 'No Records Found' })
    ).toBeVisible();
    \`\`\`

16. **Never read a DOM-dependent count with a one-shot .count() call and compare
    it with expect().toBe() — this races against the app's client-side render
    (e.g. Vue re-rendering a table after an XHR resolves, which can lag behind
    waitForLoadState('networkidle')). This passes reliably in --debug (slow
    stepping) but flakes headless. Always use Playwright's auto-retrying
    assertion instead:
    \`\`\`typescript
    // WRONG — snapshot read, no retry
    expect(await page.getRecordCount()).toBe(0);

    // CORRECT — retries until the DOM settles or times out
    await expect(page.tableRows).toHaveCount(0);
    \`\`\`

17. **GET /api/v2/pim/employees with an empNumber filter for a DELETED/non-existent
    employee returns 422, not 200 with an empty array.** Do not use RequestUtil.get()
    (which enforces status 200) for post-deletion existence checks. Use getRaw()
    and accept either outcome as proof of absence:
    \`\`\`typescript
    const raw = await requestUtil.getRaw('/api/v2/pim/employees', { empNumber });
    if (raw.status() === 200) {
      const body = await raw.json();
      expect(body.data.some((emp) => emp.empNumber === empNumber)).toBe(false);
    } else {
      expect(raw.status()).toBe(422);
    }
    \`\`\`

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
