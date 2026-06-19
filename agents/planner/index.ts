import { GeminiClient }       from '../shared/gemini-client';
import { buildPlannerPrompt } from './prompt';
import fs   from 'fs';
import path from 'path';

async function fetchIssue(issueNumber: string) {
  const { GH_TOKEN, GH_OWNER, GH_REPO } = process.env;

  const response = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/issues/${issueNumber}`,
    {
      headers: {
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept':        'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API failed: ${response.status} — Check GH_TOKEN, GH_OWNER, GH_REPO`);
  }

  const data = await response.json() as { title: string; body: string };
  return { title: data.title, body: data.body ?? '' };
}

async function main() {
  const args        = process.argv.slice(2);
  const issueFlag   = args.find(a => a.startsWith('--issue='));
  const issueNumber = issueFlag?.split('=')[1] ?? args[args.indexOf('--issue') + 1];

  if (!issueNumber) {
    console.error('Usage: ts-node agents/planner/index.ts --issue <number>');
    process.exit(1);
  }

  console.info(`🤖 Planner Agent — fetching Issue #${issueNumber} from GitHub...`);

  const issue  = await fetchIssue(issueNumber);
  console.info(`✅ Issue fetched: "${issue.title}"`);

  const gemini = GeminiClient.getInstance();
  console.info('🧠 Generating test plan with Gemini...');
  const plan   = await gemini.generate(buildPlannerPrompt(issue.title, issue.body));

  const outDir  = path.resolve('reports/test-plans');
  const outFile = path.join(outDir, `issue-${issueNumber}-test-plan.md`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, plan, 'utf-8');

  console.info(`✅ Test plan saved to ${outFile}`);
}

main().catch(console.error);