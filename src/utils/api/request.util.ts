import { APIRequestContext } from '@playwright/test';

/**
 * API Request Utility — typed wrapper around Playwright's APIRequestContext.
 * Provides consistent error handling and response parsing.
 */
export class RequestUtil {
  constructor(private readonly ctx: APIRequestContext) {}

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await this.ctx.post(endpoint, { data: body });
    this.assertOk(response, 'POST', endpoint);
    return response.json() as Promise<T>;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const response = await this.ctx.get(endpoint, { params: params as Record<string, string> });
    this.assertOk(response, 'GET', endpoint);
    return response.json() as Promise<T>;
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await this.ctx.put(endpoint, { data: body });
    this.assertOk(response, 'PUT', endpoint);
    return response.json() as Promise<T>;
  }

  async delete(endpoint: string): Promise<void> {
    const response = await this.ctx.delete(endpoint);
    this.assertOk(response, 'DELETE', endpoint);
  }

  private assertOk(response: Awaited<ReturnType<APIRequestContext['get']>>, method: string, endpoint: string): void {
    if (!response.ok()) {
      throw new Error(`${method} ${endpoint} failed with status ${response.status()}`);
    }
  }
}
