import { Page, Locator } from '@playwright/test';
import { config }        from '@config/env';

export abstract class BasePage {
  protected readonly page: Page;

  /** Path relative to baseURL, e.g. '/web/index.php/auth/login' */
  abstract readonly path: string;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageReady();
  }

  /** Override in child pages if the ready signal differs */
  public async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  protected locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  public getByText(text: string, exact = false): Locator {
    return this.page.getByText(text, { exact });
  }

  public getByRole(
    role: Parameters<Page['getByRole']>[0],
    options?: Parameters<Page['getByRole']>[1]
  ): Locator {
    return this.page.getByRole(role, options);
  }

  protected getByPlaceholder(text: string): Locator {
    return this.page.getByPlaceholder(text);
  }

  protected getByLabel(text: string): Locator {
    return this.page.getByLabel(text);
  }

  /**
   * Intercepts a background API response triggered by a UI action.
   * Use in system tests to assert both UI and network layer simultaneously.
   */
  async interceptResponse(
    urlPattern: string | RegExp,
    action: () => Promise<void>
  ) {
    const [response] = await Promise.all([
      this.page.waitForResponse(urlPattern),
      action(),
    ]);
    return response;
  }
}
