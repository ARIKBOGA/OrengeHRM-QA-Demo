import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { resolveSpecPath } from './lib/resolve-spec-path';

const INDEX_PATH = path.resolve('reports/last-failures/_index.json');

function main(): void {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error('No failure index found — run report:failures first.');
    process.exit(1);
  }

  const { files } = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8')) as { files: string[] };

  if (files.length === 0) {
    console.info('✅ Nothing to heal.');
    return;
  }

  console.info(`🔧 Healing ${files.length} file(s), sequentially...\n`);

  for (const file of files) {
    let resolved: string;
    try {
      resolved = path.relative(process.cwd(), resolveSpecPath(file)).replace(/\\/g, '/');
    } catch (err) {
      console.error(`❌ Skipping unresolvable path: ${file}`);
      continue;
    }
    console.info(`\n=== Healing: ${resolved} ===`);
    try {
      execSync(`npx ts-node agents/healer/index.ts --spec=${resolved}`, { stdio: 'inherit' });
    } catch {
      console.error(`❌ Healer failed for ${resolved} — continuing with next file.`);
    }
  }

  console.info('\n✅ Heal pass complete. Review diffs and re-run tests manually.');
}

main();
