import { GoogleGenerativeAI } from '@google/generative-ai';
import { config }             from '../../src/config/env';
import { RateLimiter }        from './rate-limiter';

/**
 * Gemini 2.5 Flash API Client — singleton with rate limiting.
 * Free tier: 10 RPM. RateLimiter keeps us safely at 9 RPM.
 */
export class GeminiClient {
  private static instance: GeminiClient;
  private readonly model:       ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>;
  private readonly rateLimiter: RateLimiter;

  private constructor() {
    const genAI      = new GoogleGenerativeAI(config.geminiApiKey);
    this.model       = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.rateLimiter = new RateLimiter({ requestsPerMinute: 9 });
  }

  static getInstance(): GeminiClient {
    if (!GeminiClient.instance) GeminiClient.instance = new GeminiClient();
    return GeminiClient.instance;
  }

  async generate(prompt: string): Promise<string> {
    await this.rateLimiter.acquire();
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}
