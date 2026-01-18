/**
 * Rate Limiting Utilities
 *
 * Provides rate limiting utilities for controlling API request frequency.
 */

import { Effect, Ref, Duration } from "effect";

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  readonly requestsPerMinute: number;
}

/**
 * Rate limiter instance
 */
export interface RateLimiter {
  /**
   * Acquire a token from the rate limiter.
   * If rate limit is exceeded, this effect will wait until a token is available.
   */
  readonly acquire: Effect.Effect<void>;
}

/**
 * Create a rate limiter with the specified request rate
 *
 * @param requestsPerMinute - Maximum number of requests allowed per minute
 * @returns An Effect that produces a RateLimiter instance
 *
 * @example
 * ```typescript
 * const limiter = yield* makeRateLimiter(120) // 120 requests per minute
 * yield* limiter.acquire // Wait until request is allowed
 * // Make API call
 * ```
 */
export const makeRateLimiter = (
  requestsPerMinute: number
): Effect.Effect<RateLimiter> =>
  Effect.gen(function* () {
    const requestTimestamps = yield* Ref.make<number[]>([]);
    const windowMs = 60000; // 1 minute

    const acquire: Effect.Effect<void> = Effect.gen(function* () {
      const now = Date.now();
      const allTimestamps = yield* Ref.get(requestTimestamps);

      // Remove timestamps outside the current window
      const recentTimestamps = allTimestamps.filter((t) => now - t < windowMs);

      if (recentTimestamps.length >= requestsPerMinute) {
        // Rate limit exceeded, wait until oldest request is outside window
        const oldestTimestamp = recentTimestamps[0]!;
        const waitMs = windowMs - (now - oldestTimestamp);

        yield* Effect.sleep(Duration.millis(waitMs));

        // Recursively try again after waiting
        return yield* acquire;
      }

      // Request allowed, record timestamp
      yield* Ref.set(requestTimestamps, [...recentTimestamps, now]);
    });

    return { acquire };
  });

/**
 * Wrap an effect with rate limiting
 *
 * @param effect - The effect to rate limit
 * @param limiter - The rate limiter to use
 * @returns An effect that waits for rate limit token before executing
 *
 * @example
 * ```typescript
 * const limiter = yield* makeRateLimiter(120)
 * const result = yield* withRateLimit(
 *   client.createChatCompletion(request),
 *   limiter
 * )
 * ```
 */
export const withRateLimit = <A, E>(
  effect: Effect.Effect<A, E>,
  limiter: RateLimiter
): Effect.Effect<A, E> => limiter.acquire.pipe(Effect.flatMap(() => effect));
