import { APIRequestContext } from '@playwright/test';
import { config }            from '@config/env';

/**
 * API Auth Utility — OrangeHRM OAuth2 token management.
 *
 * OrangeHRM REST API v2 uses OAuth2 client_credentials grant.
 * Steps:
 *   1. Create an OAuth client in OrangeHRM Admin > Configuration > Register OAuth Client
 *   2. Use client_id + client_secret to obtain a Bearer token
 *   3. Inject token into all subsequent API requests
 *
 * Token is cached in-memory for the duration of the test run.
 */
export class ApiAuthUtil {
  private static cachedToken: string | null = null;

  constructor(private readonly ctx: APIRequestContext) {}

  async getToken(): Promise<string> {
    if (ApiAuthUtil.cachedToken) return ApiAuthUtil.cachedToken;

    const response = await this.ctx.post(
      `${config.baseUrl}/web/index.php/oauth/issueToken`,
      {
        form: {
          client_id:     process.env.OAUTH_CLIENT_ID     ?? 'test_client_id',
          client_secret: process.env.OAUTH_CLIENT_SECRET ?? 'test_client_secret',
          grant_type:    'client_credentials',
        },
      }
    );

    if (!response.ok()) {
      throw new Error(
        `OAuth token request failed: ${response.status()} — ` +
        `Did you create an OAuth client in OrangeHRM Admin > Configuration > Register OAuth Client?`
      );
    }

    const body = await response.json() as { access_token: string };
    ApiAuthUtil.cachedToken = body.access_token;
    return ApiAuthUtil.cachedToken;
  }

  /** Call between test suites if you need a fresh token */
  static clearCache(): void {
    ApiAuthUtil.cachedToken = null;
  }
}
