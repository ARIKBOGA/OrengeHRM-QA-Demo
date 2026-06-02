import type { NewEmployeeData } from '@pages/employee/add-employee.page';

let counter = 0;

/**
 * Employee Factory — unique, deterministic test employee data per run.
 * Avoids data collision between parallel test runs.
 */
export function createEmployee(overrides: Partial<NewEmployeeData> = {}): NewEmployeeData {
  counter++;
  const suffix = `${Date.now()}_${counter}`;
  return {
    firstName: `Test`,
    lastName:  `Employee${suffix}`,
    ...overrides,
  };
}
