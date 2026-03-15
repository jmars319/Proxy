import type { VoiceProfile } from "@proxy/domain";
import type { Id, ProfileId, ProviderId, TimestampMs } from "@proxy/shared-types";

export interface ProfileStorage {
  list(): Promise<VoiceProfile[]>;
  get(profileId: ProfileId): Promise<VoiceProfile | null>;
  save(profile: VoiceProfile): Promise<void>;
}

export interface SettingsSnapshot {
  defaultProfileId?: ProfileId;
  allowCloudEscalation: boolean;
  localStoragePath?: string;
  syncEnabled: boolean;
}

export interface SettingsStorage {
  load(): Promise<SettingsSnapshot>;
  save(next: SettingsSnapshot): Promise<void>;
}

export interface GenerationHistoryMetadata {
  id: Id;
  profileId: ProfileId;
  providerId: ProviderId;
  createdAt: TimestampMs;
  escalated: boolean;
}

export interface SyncBoundary {
  localEnabled: true;
  remoteEnabled: boolean;
  note: string;
}

export const defaultSyncBoundary: SyncBoundary = {
  localEnabled: true,
  remoteEnabled: false,
  note: "Local storage is the default authority. Sync can be layered in later."
};
