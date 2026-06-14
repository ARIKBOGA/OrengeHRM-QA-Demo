import { GeminiClient }       from '../shared/gemini-client';
import { buildHealerPrompt }  from './prompt';
import fs   from 'fs';
import path from 'path';

function readSrc(relativePath: string): string {
  const fullPath = path.resolve(relativePath);
  return fs.existsSync(fullPath)
    ? fs.readFileSync(fullPath, 'utf-8')
    : `// FILE NOT FOUND: ${relativePath}`;
}

function readContext(filename: string): string {
  const fullPath = path.resolve(`src/context/${filename}`);
  return fs.existsSync(fullPath)
    ? fs.readFileSync(fullPath, 'utf-8')
    : `// CONTEXT NOT FOUND: ${filename}`;
}

async function main() {
  const args     = process.argv.slice(2);
  const specFlag = args.find(a => a.startsWith('--spec='));
  const specPath = specFlag?.split('=')[1] ?? args[args.indexOf('--spec') + 1];

  if (!specPath) {
    console.error('Usage: ts-node agents/healer/index.ts --spec=<path-to-spec.ts>');
    process.exit(1);
  }

  const absSpecPath = path.resolve(specPath);
  if (!fs.existsSync(absSpecPath)) {
    console.error(`Spec file not found: ${absSpecPath}`);
    process.exit(1);
  }

  const specContent = fs.readFileSync(absSpecPath, 'utf-8');

  // Hata raporunu oku — playwright son test sonuçlarını buraya yazar
  const errorReportPath = path.resolve('reports/last-failures.md');
  const errorReport = fs.existsSync(errorReportPath)
    ? fs.readFileSync(errorReportPath, 'utf-8')
    : '// No error report found — paste errors manually';

  const sourceContext = {
    'src/fixtures/base.fixture.ts':             readSrc('src/fixtures/base.fixture.ts'),
    'src/fixtures/pom.fixture.ts':              readSrc('src/fixtures/pom.fixture.ts'),
    'src/pages/base.page.ts':                   readSrc('src/pages/base.page.ts'),
    'src/pages/employee/add-employee.page.ts':  readSrc('src/pages/employee/add-employee.page.ts'),
    'src/pages/employee/employee-list.page.ts': readSrc('src/pages/employee/employee-list.page.ts'),
    'src/utils/api/request.util.ts':            readSrc('src/utils/api/request.util.ts'),
    'src/utils/api/interceptor.util.ts':        readSrc('src/utils/api/interceptor.util.ts'),
    'src/utils/db/assertion.util.ts':           readSrc('src/utils/db/assertion.util.ts'),
    'src/utils/db/seed.util.ts':                readSrc('src/utils/db/seed.util.ts'),
    'src/types/api.types.ts':                   readSrc('src/types/api.types.ts'),
  };

  const groundTruth = {
    'known-behaviors': readContext('known-behaviors.md'),
    'db-schema':       readContext('db-schema.md'),
  };

  console.info(`🔧 Healer Agent — analyzing: ${absSpecPath}`);
  console.info('🧠 Generating fix with Gemini...');

  const gemini  = GeminiClient.getInstance();
  const healedContent = await gemini.generate(
    buildHealerPrompt(specContent, errorReport, sourceContext, groundTruth)
  );

  // Orijinali yedekle
  const backupPath = absSpecPath.replace('.spec.ts', '.spec.bak.ts');
  fs.copyFileSync(absSpecPath, backupPath);
  console.info(`📦 Backup saved: ${backupPath}`);

  // Healed versiyonu yaz
  const cleaned = healedContent
    .replace(/^```typescript\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  fs.writeFileSync(absSpecPath, cleaned, 'utf-8');
  console.info(`✅ Healed file written: ${absSpecPath}`);
  console.info('\nRun tests to verify:');
  console.info(`  npx playwright test ${specPath} --project=system`);
}

main().catch(console.error);