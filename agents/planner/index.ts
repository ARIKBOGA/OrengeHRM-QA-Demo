import { GeminiClient }      from '../shared/gemini-client';
import { buildPlannerPrompt } from './prompt';
import fs   from 'fs';
import path from 'path';

async function main() {
  const args        = process.argv.slice(2);
  const issueFlag   = args.find(a => a.startsWith('--issue'));
  const issueNumber = issueFlag?.split('=')[1] ?? args[args.indexOf('--issue') + 1];

  if (!issueNumber) {
    console.error('Usage: ts-node agents/planner/index.ts --issue <number>');
    process.exit(1);
  }

  console.info(`🤖 Planner Agent — processing Issue #${issueNumber}`);

  // TODO: fetch issue from GitHub API using config.github
  const issueTitle = `[PLACEHOLDER] Issue #${issueNumber}`;
  const issueBody  = `[PLACEHOLDER] Fetch from GitHub API using GITHUB_TOKEN + GITHUB_OWNER + GITHUB_REPO`;

  const gemini = GeminiClient.getInstance();
  const plan   = await gemini.generate(buildPlannerPrompt(issueTitle, issueBody));

  const outDir  = path.resolve('reports/test-plans');
  const outFile = path.join(outDir, `issue-${issueNumber}-test-plan.md`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, plan, 'utf-8');

  console.info(`✅ Test plan saved to ${outFile}`);
}

main().catch(console.error);
