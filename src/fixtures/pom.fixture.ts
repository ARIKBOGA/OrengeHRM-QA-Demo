// src/fixtures/pom.fixture.ts
import { test as baseTest } from '@playwright/test';
import { LoginPage } from '@pages/login.page';
import { DashboardPage } from '@pages/dashboard.page';
import { AddEmployeePage } from '@pages/employee/add-employee.page';
import { EmployeeListPage } from '@pages/employee/employee-list.page';
import { AssignLeavePage } from '@pages/leave/assign-leave.page';
import { LeaveListPage } from '@pages/leave/leave-list.page';
import { AdminPage } from '@pages/admin/admin.page';

type PomFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  addEmployeePage: AddEmployeePage;
  employeeListPage: EmployeeListPage;
  assignLeavePage: AssignLeavePage;
  leaveListPage: LeaveListPage;
  adminPage: AdminPage;
};

export const test = baseTest.extend<PomFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  addEmployeePage: async ({ page }, use) => {
    await use(new AddEmployeePage(page));
  },

  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },

  assignLeavePage: async ({ page }, use) => {
    await use(new AssignLeavePage(page));
  },

  leaveListPage: async ({ page }, use) => {
    await use(new LeaveListPage(page));
  },

  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },
});

export { expect } from '@playwright/test';
