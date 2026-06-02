import { Page, Locator } from '@playwright/test';

/**
 * UI Wait Utilities — smart, reusable wait helpers.
 * Never use page.waitForTimeout() in tests. Use these instead.
 */
export class WaitUtil {
  constructor(private readonly page: Page) {}

  async forNetworkIdle(timeout = 15_000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  async forVisible(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async forHidden(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  async forURL(pattern: string | RegExp, timeout = 15_000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Retry an async action until it stops throwing or max attempts reached.
   * Useful for flaky assertions in dynamic UIs.
   */
  async retry<T>(
    action:  () => Promise<T>,
    options: { attempts?: number; delayMs?: number } = {}
  ): Promise<T> {
    const { attempts = 3, delayMs = 1_000 } = options;
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try { return await action(); }
      catch (err) {
        lastError = err;
        await this.page.waitForTimeout(delayMs);
      }
    }
    throw lastError;
  }
}
