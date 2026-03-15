/**
 * Shared primitives stay intentionally boring.
 * They should be stable enough to survive large architectural changes.
 */
export type Id = string;
export type TimestampMs = number;
export type ProviderId = `provider:${string}`;
export type ProfileId = `profile:${string}`;

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface AuditStamp {
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}

export const success = <T>(value: T): Result<T> => ({
  ok: true,
  value
});

export const failure = <E>(error: E): Result<never, E> => ({
  ok: false,
  error
});
