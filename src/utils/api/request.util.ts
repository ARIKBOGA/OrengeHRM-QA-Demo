import { APIRequestContext, expect } from '@playwright/test';

/**
 * API Request Utility — typed wrapper around Playwright's APIRequestContext.
 * Provides consistent error handling and response parsing.
 */
export class RequestUtil {
  constructor(private readonly ctx: APIRequestContext) {}

  private buildPath(endpoint: string): string {
    const base = '/web/index.php/api/v2';
    if (endpoint.startsWith('/web/')) return endpoint;
    if (endpoint.startsWith('/api/')) return endpoint.replace('/api/', '/web/index.php/api/');
    return `${base}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await this.ctx.post(this.buildPath(endpoint), { data: body });
    await this.assertOk(response, 'POST', endpoint);
    return response.json() as Promise<T>;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const response = await this.ctx.get(this.buildPath(endpoint), { params: params as Record<string, string> });
    await this.assertOk(response, 'GET', endpoint);
    return response.json() as Promise<T>;
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await this.ctx.put(this.buildPath(endpoint), { data: body });
    await this.assertOk(response, 'PUT', endpoint);
    return response.json() as Promise<T>;
  }

  async delete(endpoint: string, body?: unknown): Promise<void> {
    const response = await this.ctx.delete(this.buildPath(endpoint), body ? { data: body } : undefined);
    await this.assertOk(response, 'DELETE', endpoint);
  }

  private async assertOk(response: Awaited<ReturnType<APIRequestContext['get']>>, method: string, endpoint: string): Promise<void> {
    if (!response.ok()) {
      const bodyText = await response.text().catch(() => '<unreadable body>');
      throw new Error(`${method} ${endpoint} failed with status ${response.status()}: ${bodyText}`);
    }

    // #10: HTTP 200 for all operations — never expect 201 or 204.
    expect(response.status()).toBe(200);
  }

  async getRaw(endpoint: string, params?: Record<string, string | number>) {
    return this.ctx.get(this.buildPath(endpoint), { params: params as Record<string, string> });
  }

  async postRaw(endpoint: string, body: unknown) {
    return this.ctx.post(this.buildPath(endpoint), { data: body });
  }

  async putRaw(endpoint: string, body: unknown) {
    return this.ctx.put(this.buildPath(endpoint), { data: body });
  }

  async deleteRaw(endpoint: string, body?: unknown) {
    return this.ctx.delete(this.buildPath(endpoint), body ? { data: body } : undefined);
  }
}
