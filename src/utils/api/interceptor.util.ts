import { Page, Request, Response } from '@playwright/test';

/**
 * Interceptor Utility — captures background API calls triggered by UI actions.
 * Critical for system tests: assert UI behavior AND the underlying network call
 * in the same test without making a separate API request.
 *
 * Usage:
 *   const interceptor = new InterceptorUtil(page);
 *   interceptor.startCapturing(/\/api\/v2\/pim\/employees/);
 *   await addEmployeePage.save();
 *   expect(interceptor.getLastResponse()?.status()).toBe(200);
 */
export class InterceptorUtil {
  private capturedRequests:  Request[]  = [];
  private capturedResponses: Response[] = [];

  constructor(private readonly page: Page) {}

  startCapturing(pattern: string | RegExp): void {
    this.page.on('request',  req  => { if (this.matches(req.url(), pattern))  this.capturedRequests.push(req); });
    this.page.on('response', resp => { if (this.matches(resp.url(), pattern)) this.capturedResponses.push(resp); });
  }

  getLastRequest():  Request  | undefined { return this.capturedRequests.at(-1); }
  getLastResponse(): Response | undefined { return this.capturedResponses.at(-1); }

  async getLastResponseBody<T>(): Promise<T | null> {
    const resp = this.getLastResponse();
    return resp ? resp.json() as Promise<T> : null;
  }

  getAllResponses(): Response[] { return [...this.capturedResponses]; }

  clear(): void {
    this.capturedRequests  = [];
    this.capturedResponses = [];
  }

  private matches(url: string, pattern: string | RegExp): boolean {
    return typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url);
  }
}
