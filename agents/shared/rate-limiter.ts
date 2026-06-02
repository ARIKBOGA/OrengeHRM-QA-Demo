/**
 * Token-bucket rate limiter for Gemini free tier (10 RPM).
 */
export class RateLimiter {
  private queue:            Array<() => void> = [];
  private requestsThisMin:  number = 0;
  private windowStart:      number = Date.now();
  private readonly limit:   number;

  constructor({ requestsPerMinute }: { requestsPerMinute: number }) {
    this.limit = requestsPerMinute;
  }

  async acquire(): Promise<void> {
    return new Promise(resolve => {
      this.queue.push(resolve);
      this.flush();
    });
  }

  private flush(): void {
    const now = Date.now();
    if (now - this.windowStart >= 60_000) {
      this.windowStart     = now;
      this.requestsThisMin = 0;
    }
    while (this.queue.length > 0 && this.requestsThisMin < this.limit) {
      this.requestsThisMin++;
      this.queue.shift()!();
    }
    if (this.queue.length > 0) {
      const delay = 60_000 - (Date.now() - this.windowStart);
      setTimeout(() => this.flush(), delay);
    }
  }
}
