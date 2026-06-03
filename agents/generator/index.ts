import { GeminiClient }         from '../shared/gemini-client';
import { buildGeneratorPrompt } from './prompt';
import fs   from 'fs';
import path from 'path';

function readSrc(relativePath: string): string {
  const fullPath = path.resolve(relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : `// FILE NOT FOUND: ${relativePath}`;
}

function parseGeneratedFiles(raw: string): Array<{ filePath: string; content: string }> {
  const files: Array<{ filePath: string; content: string }> = [];
  const blocks = raw.split(/\/\/ ─+/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines     = block.split('\n');
    const firstLine = lines[0].trim();
    const pathMatch = firstLine.match(/^\/\/\s*(tests\/.+\.spec\.ts)/);
    if (!pathMatch) continue;

    const filePath = pathMatch[1];
    const content  = lines.slice(1).join('\n')
      .replace(/^```typescript\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    files.push({ filePath, content });
  }
  return files;
}

async function main() {
  const args     = process.argv.slice(2);
  const planFlag = args.find(a => a.startsWith('--plan='));
  const planPath = planFlag?.split('=')[1] ?? args[args.indexOf('--plan') + 1];

  if (!planPath) {
    console.error('Usage: ts-node agents/generator/index.ts --plan=<path>');
    process.exit(1);
  }

  const absolutePlanPath = path.resolve(planPath);
  if (!fs.existsSync(absolutePlanPath)) {
    console.error(`Plan file not found: ${absolutePlanPath}`);
    process.exit(1);
  }

  const testPlanContent = fs.readFileSync(absolutePlanPath, 'utf-8');

  // Gerçek kaynak dosyalarını oku — Gemini bunları görecek
  const sourceContext = {
    'src/fixtures/base.fixture.ts':              readSrc('src/fixtures/base.fixture.ts'),
    'src/fixtures/auth.fixture.ts':              readSrc('src/fixtures/auth.fixture.ts'),
    'src/fixtures/api.fixture.ts':               readSrc('src/fixtures/api.fixture.ts'),
    'src/fixtures/db.fixture.ts':                readSrc('src/fixtures/db.fixture.ts'),
    'src/fixtures/pom.fixture.ts':               readSrc('src/fixtures/pom.fixture.ts'),
    'src/pages/base.page.ts':                    readSrc('src/pages/base.page.ts'),
    'src/pages/login.page.ts':                   readSrc('src/pages/login.page.ts'),
    'src/pages/employee/add-employee.page.ts':   readSrc('src/pages/employee/add-employee.page.ts'),
    'src/pages/employee/employee-list.page.ts':  readSrc('src/pages/employee/employee-list.page.ts'),
    'src/utils/api/request.util.ts':             readSrc('src/utils/api/request.util.ts'),
    'src/utils/api/interceptor.util.ts':         readSrc('src/utils/api/interceptor.util.ts'),
    'src/utils/db/assertion.util.ts':            readSrc('src/utils/db/assertion.util.ts'),
    'src/utils/db/seed.util.ts':                 readSrc('src/utils/db/seed.util.ts'),
    'src/data/factories/employee.factory.ts':    readSrc('src/data/factories/employee.factory.ts'),
    'src/types/api.types.ts':                    readSrc('src/types/api.types.ts'),
    'src/config/env.ts':                         readSrc('src/config/env.ts'),
  };

  console.info(`🤖 Generator Agent — reading plan: ${absolutePlanPath}`);
  console.info('🧠 Generating test files with Gemini...');

  const gemini = GeminiClient.getInstance();
  const raw    = await gemini.generate(buildGeneratorPrompt(testPlanContent, sourceContext));
  const files  = parseGeneratedFiles(raw);

  if (files.length === 0) {
    console.warn('⚠️  No files parsed. Raw output saved to reports/generator-raw.txt');
    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync('reports/generator-raw.txt', raw, 'utf-8');
    process.exit(1);
  }

  console.info(`✅ ${files.length} file(s) parsed\n`);

  for (const { filePath, content } of files) {
    const absPath = path.resolve(filePath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content, 'utf-8');
    console.info(`  📄 ${filePath}`);
  }

  console.info('\n✅ Done. Run: npm run test:integration');
}

main().catch(console.error);