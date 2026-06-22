/**
 * Spec dosya path'ini, reports/last-failures/ altında dosya adı olarak
 * kullanılabilecek güvenli bir slug'a çevirir.
 * e.g. tests/system/pim/employee.spec.ts -> tests__system__pim__employee
 */
export function specToSlug(specPath: string): string {
  const normalized = specPath.replace(/\\/g, '/').replace(/^\.\//, '');
  const withoutExt = normalized.replace(/\.spec\.ts$/, '');
  return withoutExt.replace(/\//g, '__');
}