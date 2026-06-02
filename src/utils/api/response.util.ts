import { APIResponse } from '@playwright/test';

/**
 * Response Utility — helpers for validating API responses.
 */
export class ResponseUtil {
  static async assertStatus(response: APIResponse, expectedStatus: number): Promise<void> {
    if (response.status() !== expectedStatus) {
      const body = await response.text();
      throw new Error(
        `Expected status ${expectedStatus}, got ${response.status()}.\nBody: ${body}`
      );
    }
  }

  static async parseJson<T>(response: APIResponse): Promise<T> {
    return response.json() as Promise<T>;
  }

  static assertHasField<T extends object>(body: T, field: keyof T): void {
    if (body[field] === undefined || body[field] === null) {
      throw new Error(`Expected field "${String(field)}" in response body, but it was missing.`);
    }
  }
}
