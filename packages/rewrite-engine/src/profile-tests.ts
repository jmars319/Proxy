import defaultRewriteFixture001 from "../../../profiles/default/tests/rewrite-001.json";
import defaultRewriteFixture002 from "../../../profiles/default/tests/rewrite-002.json";
import type { RewriteTraceEntry } from "@proxy/domain";
import { loadProfile } from "@proxy/profiles";
import {
  parseProfileRewriteTestFixture,
  validateRewrittenOutput,
  type ProfileRewriteTestFixtureInput
} from "@proxy/validation";
import { rewriteDraft } from "./index";

export type ProfileRewriteTestFixture = ProfileRewriteTestFixtureInput;

export interface ProfileTestResult {
  name: string;
  passed: boolean;
  failures: string[];
}

export interface ProfileTestFailure {
  name: string;
  reason: string;
}

export interface ProfileTestReport {
  profileId: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: ProfileTestResult[];
  failures: ProfileTestFailure[];
}

const profileRewriteFixtureRegistry: Record<string, unknown[]> = {
  default: [defaultRewriteFixture001, defaultRewriteFixture002]
};

const normalizeProfileLookupId = (profileId: string): string => profileId.replace(/^profile:/, "");

const includesCaseInsensitive = (source: string, query: string): boolean =>
  source.toLowerCase().includes(query.toLowerCase());

export const loadProfileRewriteTestFixtures = (profileId: string): ProfileRewriteTestFixture[] => {
  const lookupId = normalizeProfileLookupId(profileId);
  const candidates = profileRewriteFixtureRegistry[lookupId];

  if (!candidates) {
    throw new Error(`No rewrite test fixtures are registered for "${profileId}".`);
  }

  return candidates.map((candidate, index) => {
    const parsed = parseProfileRewriteTestFixture(candidate);
    if (!parsed.success) {
      throw new Error(`Rewrite test fixture ${index + 1} for "${profileId}" is invalid.`);
    }

    return parsed.data;
  });
};

const hasExpectedTraceKind = (
  trace: RewriteTraceEntry[],
  expectedKind: RewriteTraceEntry["kind"]
): boolean => trace.some((entry) => entry.kind === expectedKind);

export const runProfileTests = (profileId: string): ProfileTestReport => {
  const profile = loadProfile(profileId);
  const fixtures = loadProfileRewriteTestFixtures(profileId);

  const results = fixtures.map<ProfileTestResult>((fixture) => {
    const rewrite = rewriteDraft(fixture.providerDraft, profile);
    const validation = validateRewrittenOutput(rewrite.rewritten, profile);
    const failures: string[] = [];

    if (!rewrite.rewritten.trim()) {
      failures.push("Rewrite output is empty.");
    }

    const remainingBannedPhrases = profile.bannedPhrases.filter((phrase) =>
      includesCaseInsensitive(rewrite.rewritten, phrase)
    );
    if (remainingBannedPhrases.length > 0) {
      failures.push(`Banned phrases remain: ${remainingBannedPhrases.join(", ")}.`);
    }

    const expectedRemovalsLeft = fixture.expected.mustRemove.filter((phrase) =>
      includesCaseInsensitive(rewrite.rewritten, phrase)
    );
    if (expectedRemovalsLeft.length > 0) {
      failures.push(`Expected removed text still present: ${expectedRemovalsLeft.join(", ")}.`);
    }

    const missingTraceKinds = fixture.expected.traceIncludes.filter(
      (kind) => !hasExpectedTraceKind(rewrite.trace, kind)
    );
    if (missingTraceKinds.length > 0) {
      failures.push(`Missing trace kinds: ${missingTraceKinds.join(", ")}.`);
    }

    if (!validation.valid) {
      failures.push(...validation.violations);
    }

    return {
      name: fixture.name,
      passed: failures.length === 0,
      failures
    };
  });

  const failures = results.flatMap<ProfileTestFailure>((result) =>
    result.failures.map((reason) => ({
      name: result.name,
      reason
    }))
  );

  return {
    profileId: normalizeProfileLookupId(profileId),
    totalTests: results.length,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    results,
    failures
  };
};
