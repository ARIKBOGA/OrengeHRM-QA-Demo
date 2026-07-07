import fs from 'fs';
import path from 'path';

const PROJECT_DIRS = ['system', 'integration', 'e2e'];

/**
 * Playwright JSON reporter, spec.file'ı proje bazlı testDir'e göre relative
 * yazıyor (örn. 'system/pim/employee.spec.ts'), root 'tests/' prefix'i eksik
 * kalıyor. Bu fonksiyon dosyayı gerçekten var olduğu yerde bulur.
 */
export function resolveSpecPath(rawFile: string): string {
  const normalized = rawFile.replace(/\\/g, '/');

  // 1. Zaten doğrudan çözülüyor mu? (tests/ prefix'i ile veya mutlak)
  const direct = path.resolve(normalized);
  if (fs.existsSync(direct)) return direct;

  // 2. 'tests/' prefix'i ekleyerek dene
  const withTestsPrefix = path.resolve('tests', normalized);
  if (fs.existsSync(withTestsPrefix)) return withTestsPrefix;

  // 3. Proje adını (system/integration/e2e) baştan atıp yeniden 'tests/<proje>/...' kur
  for (const proj of PROJECT_DIRS) {
    if (normalized.startsWith(`${proj}/`)) {
      const candidate = path.resolve('tests', normalized);
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  throw new Error(`Could not resolve spec path for reported file: ${rawFile}`);
}