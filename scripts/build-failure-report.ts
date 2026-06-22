import fs from 'fs';
import path from 'path';
import { specToSlug } from './lib/spec-slug';

const RESULTS_PATH = path.resolve('reports/results.json');
const FAILURES_DIR = path.resolve('reports/last-failures');
const INDEX_PATH = path.join(FAILURES_DIR, '_index.json');

function collectTests(suite: any, acc: { spec: any; test: any }[] = []) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      acc.push({ spec, test });
    }
  }
  for (const child of suite.suites ?? []) {
    collectTests(child, acc);
  }
  return acc;
}

function resetFailuresDir(): void {
  // Önceki run'dan kalan raporları temizle — çözülmüş issue'lar
  // yeniden healing'e girmesin garantisi buradan geliyor.
  if (fs.existsSync(FAILURES_DIR)) {
    fs.rmSync(FAILURES_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(FAILURES_DIR, { recursive: true });
}

function main(): void {
  if (!fs.existsSync(RESULTS_PATH)) {
    console.error(`Results file not found: ${RESULTS_PATH}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf-8'));
  const allTests: { spec: any; test: any }[] = [];
  for (const suite of raw.suites ?? []) {
    collectTests(suite, allTests);
  }

  const failed = allTests.filter(({ test }) =>
    test.results?.some((r: any) => r.status === 'failed' || r.status === 'timedOut')
  );

  resetFailuresDir();

  if (failed.length === 0) {
    fs.writeFileSync(INDEX_PATH, JSON.stringify({ files: [] }, null, 2));
    console.info('✅ No failures in last run — nothing to heal.');
    process.exit(1); // chain'de healer'ı atlamak için kasıtlı
  }

  const byFile = new Map<string, { spec: any; test: any }[]>();
  for (const entry of failed) {
    const file = entry.spec.file as string;
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file)!.push(entry);
  }

  const writtenFiles: string[] = [];

  for (const [file, entries] of byFile) {
    let md = `# Failures — ${file}\n\n> Generated: ${new Date().toISOString()}\n\n`;

    for (const { spec, test } of entries) {
      const lastResult = test.results[test.results.length - 1];
      md += `## ${spec.title}\n\n`;
      md += `- **Line:** ${spec.line}\n`;
      md += `- **Status:** ${lastResult.status}\n\n`;

      const errors = lastResult.errors?.length ? lastResult.errors : lastResult.error ? [lastResult.error] : [];
      for (const err of errors) {
        md += '### Error\n\n```\n';
        md += `${err.message ?? JSON.stringify(err)}\n`;
        md += '```\n\n';
      }

      if (lastResult.stdout?.length) {
        md += '### Stdout\n\n```\n';
        md += lastResult.stdout.map((s: any) => s.text ?? s).join('');
        md += '\n```\n\n';
      }

      md += '---\n\n';
    }

    const slug = specToSlug(file);
    fs.writeFileSync(path.join(FAILURES_DIR, `${slug}.md`), md, 'utf-8');
    writtenFiles.push(file);
    console.info(`📝 ${file} → ${entries.length} failing test(s)`);
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify({ files: writtenFiles }, null, 2));
  console.info(`✅ ${writtenFiles.length} file(s) flagged for healing.`);
}

main();