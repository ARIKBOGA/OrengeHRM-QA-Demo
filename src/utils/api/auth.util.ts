import { APIRequestContext } from '@playwright/test';
import { config }            from '@config/env';

export class ApiAuthUtil {
  private static cachedToken: string | null = null;

  constructor(private readonly ctx: APIRequestContext) {}

  async getToken(): Promise<string> {
    if (ApiAuthUtil.cachedToken) return ApiAuthUtil.cachedToken;

    const response = await this.ctx.post(
      `${config.baseUrl}/web/index.php/oauth/issueToken`,
      {
        form: {
          client_id:  process.env.OAUTH_CLIENT_ID ?? '',
          grant_type: 'password',
          username:   process.env.OAUTH_USERNAME  ?? config.admin.username,
          password:   process.env.OAUTH_PASSWORD  ?? config.admin.password,
        },
      }
    );

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(
        `OAuth token request failed: ${response.status()}\n${body}\n` +
        `Check OAUTH_CLIENT_ID, OAUTH_USERNAME, OAUTH_PASSWORD in .env.local`
      );
    }

    const body = await response.json() as { access_token: string };
    ApiAuthUtil.cachedToken = body.access_token;
    return ApiAuthUtil.cachedToken;
  }

  static clearCache(): void {
    ApiAuthUtil.cachedToken = null;
  }
}