import { chromium, request, FullConfig } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';
import { config } from '../src/config/env';

/**
 * Runs ONCE before the entire test run, outside any fixture/test context.
 * Provisions Leave-module prerequisites that a fresh Docker seed doesn't
 * include (see known-behaviors.md → "Leave Module Prerequisites").
 * Every check is idempotent — safe to run against an already-provisioned DB.
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  console.info('\n🔧 Global setup — provisioning Leave module prerequisites...');

  // 1. Log in once via UI to obtain the session cookie.
  //    Reuses the same LoginPage as auth.fixture.ts — no duplicated login logic.
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.login(config.admin.username, config.admin.password);
  await loginPage.expectDashboardVisible();

  const cookies = await context.cookies();
  const sessionCookie = cookies.find((c) => c.name === '_orangehrm');
  if (!sessionCookie) {
    throw new Error('Global setup failed: _orangehrm session cookie not found after login.');
  }

  await browser.close();

  // 2. Plain API request context — deliberately NOT RequestUtil, since
  //    RequestUtil.assertOk() calls expect(), which requires test context
  //    that doesn't exist here.
  const api = await request.newContext({
    baseURL: config.baseUrl,
    extraHTTPHeaders: {
      Cookie: `_orangehrm=${sessionCookie.value}`,
      'Content-Type': 'application/json',
    },
  });

  await ensureLeavePeriod(api);
  await ensureLeaveType(api);
  await ensureWorkweek(api);

  await api.dispose();
  console.info('✅ Leave module prerequisites confirmed.\n');
}

async function ensureLeavePeriod(api: Awaited<ReturnType<typeof request.newContext>>): Promise<void> {
  const res = await api.get('/web/index.php/api/v2/leave/leave-period');
  const body = await res.json();

  if (body.meta?.leavePeriodDefined) {
    console.info('  • Leave Period already defined — skipping.');
    return;
  }

  await api.put('/web/index.php/api/v2/leave/leave-period', {
    data: { startDay: 1, startMonth: 1 },
  });
  console.info('  • Leave Period provisioned (Jan 1 – Dec 31).');
}

async function ensureLeaveType(api: Awaited<ReturnType<typeof request.newContext>>): Promise<void> {
  const res = await api.get('/web/index.php/api/v2/leave/leave-types');
  const body = await res.json();

  if (body.data?.length > 0) {
    console.info(`  • Leave Type(s) already exist (${body.data.length}) — skipping.`);
    return;
  }

  await api.post('/web/index.php/api/v2/leave/leave-types', {
    data: { name: 'Annual Leave', situational: false },
  });
  console.info('  • Leave Type "Annual Leave" created.');
}

async function ensureWorkweek(api: Awaited<ReturnType<typeof request.newContext>>): Promise<void> {
  const res = await api.get('/web/index.php/api/v2/leave/workweek');
  const body = await res.json();
  const days = body.data;

  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
  const needsFix = weekdays.some((day) => days[day] !== 8);

  if (!needsFix) {
    console.info('  • Workweek already correct (Mon–Fri = 8h) — skipping.');
    return;
  }

  await api.put('/web/index.php/api/v2/leave/workweek', {
    data: {
      monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8,
      saturday: 0, sunday: 0,
    },
  });
  console.info('  • Workweek corrected to Mon–Fri = 8h, Sat/Sun = 0h.');
}

export default globalSetup;