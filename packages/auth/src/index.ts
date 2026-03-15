import type { Id, TimestampMs } from "@proxy/shared-types";

/**
 * Auth stays intentionally sparse in v0.
 * Proxy may later support local identity or optional cloud-linked accounts.
 */
export interface LocalUser {
  id: Id;
  displayName: string;
  isCloudLinked: boolean;
}

export interface SessionSnapshot {
  sessionId: Id;
  userId: Id | null;
  createdAt: TimestampMs;
  lastActiveAt: TimestampMs;
}

export const createAnonymousSession = (sessionId: Id, now: TimestampMs): SessionSnapshot => ({
  sessionId,
  userId: null,
  createdAt: now,
  lastActiveAt: now
});

export const hasLinkedCloudIdentity = (
  user: Pick<LocalUser, "isCloudLinked"> | null | undefined
): boolean => Boolean(user?.isCloudLinked);
