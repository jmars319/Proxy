import { Fragment, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { APP_NAME, REPO_NAME } from "@proxy/config";
import type { RewriteReport, ValidationReport, VoiceProfile } from "@proxy/domain";
import { DEFAULT_PROFILE_ARTIFACT_PATH, loadDefaultProfile } from "@proxy/profiles";
import { createDefaultProvider } from "@proxy/providers";
import {
  runProfileTests,
  type ProfileTestReport
} from "@proxy/rewrite-engine/profile-tests";
import { rewriteDraft } from "@proxy/rewrite-engine";
import { SectionCard } from "@proxy/ui";
import { validateRewrittenOutput } from "@proxy/validation";

const defaultPrompt =
  "Explain why clear communication matters when using AI tools for everyday work.";
const provider = createDefaultProvider(import.meta.env);

interface PipelineSnapshot {
  prompt: string;
  profile: VoiceProfile;
  rawDraft: string;
  rewrite: RewriteReport;
  validation: ValidationReport;
  finalOutput: string;
  latencyMs: number;
}

interface PipelineStage {
  label: string;
  text: string;
  note: string;
}

interface SavedPipelineRun {
  id: string;
  createdAt: string;
  providerLabel: string;
  snapshot: PipelineSnapshot;
}

const historyStorageKey = "tenra-proxy-desktop-history:v1";
const profileStorageKey = "tenra-proxy-active-profile:v1";
const maxSavedRuns = 40;

const suitePromptTemplates = [
  {
    label: "Assembly brief",
    prompt: "Rewrite this approved brief into concise internal content language while preserving all claims and review caveats."
  },
  {
    label: "Registry document",
    prompt: "Rewrite this rental document paragraph so it is clear, direct, and suitable for a customer-facing storage-container rental agreement."
  },
  {
    label: "Scout outreach",
    prompt: "Rewrite this Scout opportunity note into a restrained outreach draft that references only the evidence provided."
  }
];

const getFinalOutput = (rewrite: RewriteReport, validation: ValidationReport): string =>
  validation.valid ? rewrite.rewritten : "Validation blocked the rewritten output.";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `proxy-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const nowIso = () => new Date().toISOString();

const loadSavedPipelineRuns = (): SavedPipelineRun[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(historyStorageKey);
    const parsed = raw ? (JSON.parse(raw) as SavedPipelineRun[]) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistSavedPipelineRuns = (runs: SavedPipelineRun[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(historyStorageKey, JSON.stringify(runs));
};

const cloneProfile = (profile: VoiceProfile): VoiceProfile =>
  JSON.parse(JSON.stringify(profile)) as VoiceProfile;

const loadStoredProfile = (): VoiceProfile => {
  const fallback = loadDefaultProfile();

  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(profileStorageKey);
    const parsed = raw ? (JSON.parse(raw) as VoiceProfile) : null;

    if (!parsed?.metadata?.name || !Array.isArray(parsed.bannedPhrases) || !Array.isArray(parsed.styleRules)) {
      return fallback;
    }

    return parsed;
  } catch {
    return fallback;
  }
};

const persistStoredProfile = (profile: VoiceProfile) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(profileStorageKey, JSON.stringify(profile));
};

const profileToDraft = (profile: VoiceProfile) => ({
  name: profile.metadata.name,
  tone: profile.tone,
  bannedPhrases: profile.bannedPhrases.join("\n"),
  styleRules: profile.styleRules.join("\n")
});

const splitLines = (value: string): string[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const formatSavedRunTime = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));

const buildPipelineStages = (
  prompt: string,
  profile: VoiceProfile,
  pipeline: PipelineSnapshot | null
): PipelineStage[] => [
  {
    label: "User Prompt",
    text: pipeline?.prompt ?? (prompt.trim() || "Waiting for a prompt."),
    note: "User input is the only thing entering the flow."
  },
  {
    label: "Provider Draft",
    text: pipeline?.rawDraft ?? "Run the pipeline to generate the source draft.",
    note: `${provider.descriptor.label} supplies the first-pass response.`
  },
  {
    label: "Rewrite Engine",
    text: pipeline?.rewrite.rewritten ?? "Rewrite output appears after the provider draft.",
    note: pipeline
      ? `${pipeline.rewrite.trace.length} rewrite notes explain how the profile shaped the draft.`
      : `Deterministic local rewrite pass using the "${profile.metadata.name}" profile.`
  },
  {
    label: "Validation",
    text: pipeline
      ? pipeline.validation.valid
        ? "Validation passed."
        : "Validation failed."
      : "Validation runs after rewriting.",
    note: pipeline
      ? pipeline.validation.warnings.length > 0
        ? pipeline.validation.warnings.join(" ")
        : "No warnings."
      : "Checks banned phrases, empty output, and length."
  },
  {
    label: "Final Output",
    text: pipeline?.finalOutput ?? "Final output appears here after validation.",
    note: "Only the post-rewrite, post-validation output is user-facing."
  }
];

export default function App() {
  const defaultProfile = loadDefaultProfile();
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const [localProfile, setLocalProfile] = useState<VoiceProfile>(loadStoredProfile);
  const [profileDraft, setProfileDraft] = useState(profileToDraft(localProfile));
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [pipeline, setPipeline] = useState<PipelineSnapshot | null>(null);
  const [savedPipelineRuns, setSavedPipelineRuns] = useState<SavedPipelineRun[]>(
    loadSavedPipelineRuns
  );
  const [profileTestReport, setProfileTestReport] = useState<ProfileTestReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isRunningProfileTests, setIsRunningProfileTests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileTestError, setProfileTestError] = useState<string | null>(null);

  useEffect(() => {
    persistSavedPipelineRuns(savedPipelineRuns);
  }, [savedPipelineRuns]);

  useEffect(() => {
    persistStoredProfile(localProfile);
  }, [localProfile]);

  const handleRun = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError("Enter a prompt before running the pipeline.");
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const draft = await provider.generateDraft(trimmedPrompt);
      const profile = cloneProfile(localProfile);
      const rewrite = rewriteDraft(draft.text, profile);
      const validation = validateRewrittenOutput(rewrite.rewritten, profile);
      const snapshot: PipelineSnapshot = {
        prompt: trimmedPrompt,
        profile,
        rawDraft: draft.text,
        rewrite,
        validation,
        finalOutput: getFinalOutput(rewrite, validation),
        latencyMs: draft.latencyMs
      };

      setPipeline(snapshot);
      setSavedPipelineRuns((current) =>
        [
          {
            id: createId(),
            createdAt: nowIso(),
            providerLabel: provider.descriptor.label,
            snapshot
          },
          ...current
        ].slice(0, maxSavedRuns)
      );
    } catch {
      setError("The local provider pipeline failed unexpectedly.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunProfileTests = () => {
    setIsRunningProfileTests(true);
    setProfileTestError(null);

    try {
      const report = runProfileTests("default");
      setProfileTestReport(report);
    } catch {
      setProfileTestError("Profile tests failed to run.");
    } finally {
      setIsRunningProfileTests(false);
    }
  };

  const applySuitePrompt = (nextPrompt: string) => {
    setPrompt(nextPrompt);
    setError(null);
  };

  const restoreSavedRun = (savedRun: SavedPipelineRun) => {
    setPrompt(savedRun.snapshot.prompt);
    setPipeline(savedRun.snapshot);
    setError(null);
  };

  const removeSavedRun = (savedRunId: string) => {
    setSavedPipelineRuns((current) => current.filter((savedRun) => savedRun.id !== savedRunId));
  };

  const saveProfileDraft = () => {
    const now = Date.now();
    const nextStyleRules = splitLines(profileDraft.styleRules);

    setLocalProfile((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        name: profileDraft.name.trim() || current.metadata.name,
        updatedAt: now
      },
      tone: profileDraft.tone.trim() || current.tone,
      bannedPhrases: splitLines(profileDraft.bannedPhrases),
      styleRules: nextStyleRules,
      rewriteDirectives: nextStyleRules,
      rules: nextStyleRules.map((rule, index) => ({
        kind: "style",
        label: `Style rule ${index + 1}`,
        instruction: rule
      }))
    }));
    setError(null);
  };

  const resetProfileDraft = () => {
    const nextProfile = loadDefaultProfile();
    setLocalProfile(nextProfile);
    setProfileDraft(profileToDraft(nextProfile));
    setError(null);
  };

  const exportProfile = () => {
    const blob = new Blob([JSON.stringify(localProfile, null, 2)], {
      type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${localProfile.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "proxy-profile"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importProfile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text()) as VoiceProfile;
      if (!parsed?.metadata?.name || !Array.isArray(parsed.bannedPhrases) || !Array.isArray(parsed.styleRules)) {
        throw new Error("Profile JSON is missing required fields.");
      }

      setLocalProfile(parsed);
      setProfileDraft(profileToDraft(parsed));
      setError(null);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Profile import failed.");
    }
  };

  const copyFinalOutput = async () => {
    if (!pipeline) return;

    try {
      await navigator.clipboard.writeText(pipeline.finalOutput);
    } catch {
      setError("Final output copy failed.");
    }
  };

  const activeProfile = pipeline?.profile ?? localProfile ?? defaultProfile;
  const stages = buildPipelineStages(prompt, activeProfile, pipeline);

  return (
    <div className="workspace-shell">
      <header className="workspace-hero">
        <div className="hero-copy">
          <span className="eyebrow">tenra Proxy v0.2</span>
          <h1>Rewrite trace and portable profile artifacts</h1>
          <p>
            Prompt in. Generic provider draft out. Then tenra Proxy rewrites it with the active voice
            profile artifact, validates it, and shows why the final output sounds more like the
            profile than the provider draft did.
          </p>
        </div>
        <div className="hero-badges" aria-label="Flow summary">
          <span>Prompt</span>
          <span>Provider</span>
          <span>Rewrite</span>
          <span>Validation</span>
          <span>Final Output</span>
        </div>
      </header>

      <div className="workspace-grid">
        <div className="span-5">
          <SectionCard
            eyebrow="Workspace"
            title="Run the pipeline"
            description="This slice proves the product boundary: provider output is only draft material until tenra Proxy rewrites and validates it."
          >
            <form className="prompt-form" onSubmit={handleRun}>
              <label className="field-label" htmlFor="proxy-prompt">
                Prompt
              </label>
              <textarea
                id="proxy-prompt"
                className="prompt-input"
                rows={7}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe the response you want tenra Proxy to process."
              />
              <div className="suite-template-row" aria-label="Suite prompt starters">
                {suitePromptTemplates.map((template) => (
                  <button
                    className="secondary-button"
                    key={template.label}
                    type="button"
                    onClick={() => applySuitePrompt(template.prompt)}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
              <div className="form-actions">
                <button className="run-button" type="submit" disabled={isRunning}>
                  {isRunning ? "Running..." : "Run Rewrite Pipeline"}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={isRunningProfileTests}
                  onClick={handleRunProfileTests}
                >
                  {isRunningProfileTests ? "Running Tests..." : "Run Profile Tests"}
                </button>
                <span className="microcopy">
                  {pipeline
                    ? `${pipeline.latencyMs}ms preview provider latency`
                    : "Local preview provider"}
                </span>
              </div>
            </form>
            {error ? <p className="error-banner">{error}</p> : null}
            {profileTestError ? <p className="error-banner">{profileTestError}</p> : null}
          </SectionCard>
        </div>

        <div className="span-7">
          <SectionCard
            eyebrow="Active Profile"
            title={activeProfile.metadata.name}
            description="Profiles are portable artifacts. tenra Proxy loads the artifact, validates it, then turns it into the richer domain shape used by the rewrite pipeline."
          >
            <dl className="detail-stack">
              <div>
                <dt>Tone</dt>
                <dd>{activeProfile.tone}</dd>
              </div>
              <div>
                <dt>Banned phrases</dt>
                <dd>{activeProfile.bannedPhrases.join(", ")}</dd>
              </div>
              <div>
                <dt>Style rules</dt>
                <dd>{activeProfile.styleRules.join(", ")}</dd>
              </div>
              <div>
                <dt>Artifact path</dt>
                <dd>{DEFAULT_PROFILE_ARTIFACT_PATH}</dd>
              </div>
              <div>
                <dt>Test fixtures</dt>
                <dd>profiles/default/tests/</dd>
              </div>
            </dl>
          </SectionCard>
        </div>

        <div className="span-12">
          <SectionCard
            eyebrow="Local Profile"
            title="Edit active voice profile"
            description="The desktop pipeline uses this local profile for rewriting and validation. Export it when it should become a portable artifact."
          >
            <div className="profile-editor-grid">
              <label className="profile-editor-field">
                <span>Profile name</span>
                <input
                  value={profileDraft.name}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label className="profile-editor-field">
                <span>Tone</span>
                <input
                  value={profileDraft.tone}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, tone: event.target.value }))
                  }
                />
              </label>
              <label className="profile-editor-field">
                <span>Banned phrases</span>
                <textarea
                  rows={5}
                  value={profileDraft.bannedPhrases}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, bannedPhrases: event.target.value }))
                  }
                />
              </label>
              <label className="profile-editor-field">
                <span>Style rules</span>
                <textarea
                  rows={5}
                  value={profileDraft.styleRules}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, styleRules: event.target.value }))
                  }
                />
              </label>
            </div>
            <div className="form-actions profile-editor-actions">
              <button className="run-button" type="button" onClick={saveProfileDraft}>
                Save Profile
              </button>
              <button className="secondary-button" type="button" onClick={exportProfile}>
                Export Profile
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => profileFileInputRef.current?.click()}
              >
                Import Profile
              </button>
              <button className="secondary-button" type="button" onClick={resetProfileDraft}>
                Reset Default
              </button>
              <input
                ref={profileFileInputRef}
                className="hidden-file-input"
                type="file"
                accept="application/json"
                onChange={importProfile}
              />
            </div>
          </SectionCard>
        </div>

        <div className="span-12">
          <SectionCard
            eyebrow="Local History"
            title="Saved pipeline runs"
            description="Runs are stored on this desktop so useful rewrites can be reopened without cloud sync."
          >
            <div className="history-run-list">
              {savedPipelineRuns.length > 0 ? (
                savedPipelineRuns.map((savedRun) => (
                  <article className="history-run-item" key={savedRun.id}>
                    <div>
                      <strong>{savedRun.snapshot.prompt}</strong>
                      <span>
                        {formatSavedRunTime(savedRun.createdAt)} / {savedRun.providerLabel} /{" "}
                        {savedRun.snapshot.latencyMs}ms
                      </span>
                      <p>{savedRun.snapshot.finalOutput}</p>
                    </div>
                    <div className="history-run-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => restoreSavedRun(savedRun)}
                      >
                        Restore
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => removeSavedRun(savedRun.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty-copy">No saved runs yet.</p>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="span-12">
          <SectionCard
            eyebrow="Profile Tests"
            title="Behavior checks for the active profile"
            description="Fixtures verify that the profile still shapes rewrite behavior the way tenra Proxy expects, without locking to exact output text."
          >
            <div className="test-summary">
              {profileTestReport ? (
                <strong>
                  Passed: {profileTestReport.passed} / {profileTestReport.totalTests}
                </strong>
              ) : (
                <strong>Run the profile tests to verify the default artifact.</strong>
              )}
            </div>
            <ul className="test-result-list">
              {profileTestReport ? (
                profileTestReport.results.map((result) => (
                  <li
                    key={result.name}
                    className={result.passed ? "test-result test-result-pass" : "test-result test-result-fail"}
                  >
                    <div className="test-result-header">
                      <span>{result.name}</span>
                      <strong>{result.passed ? "PASS" : "FAIL"}</strong>
                    </div>
                    {!result.passed && result.failures.length > 0 ? (
                      <ul className="test-failure-list">
                        {result.failures.map((failure) => (
                          <li key={`${result.name}-${failure}`}>{failure}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="test-result">
                  Fixture-backed rewrite checks have not been run yet.
                </li>
              )}
            </ul>
          </SectionCard>
        </div>

        <div className="span-12">
          <SectionCard
            eyebrow="Flow"
            title="Prompt to final output"
            description="The visible product behavior is the pipeline itself, not a chat transcript."
          >
            <div className="pipeline-flow">
              {stages.map((stage, index) => (
                <Fragment key={stage.label}>
                  <article className="pipeline-stage">
                    <span className="stage-label">{stage.label}</span>
                    <p className="stage-output">{stage.text}</p>
                    <p className="stage-note">{stage.note}</p>
                  </article>
                  {index < stages.length - 1 ? (
                    <div className="pipeline-arrow" aria-hidden="true">
                      ↓
                    </div>
                  ) : null}
                </Fragment>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="span-6">
          <SectionCard
            eyebrow="Provider Draft"
            title="Raw draft"
            description="This is intentionally generic upstream-style output."
          >
            <div className="output-panel">
              {pipeline?.rawDraft ?? "Run the pipeline to inspect the source draft."}
            </div>
          </SectionCard>
        </div>

        <div className="span-6">
          <SectionCard
            eyebrow="Rewrite Engine"
            title="Rewritten output"
            description="The rewrite pass removes banned phrases, shifts tone, tightens wording, and shortens structure where the profile asks for it."
          >
            <div className="output-panel">
              {pipeline?.rewrite.rewritten ?? "Rewrite output appears after the provider draft."}
            </div>
            <ul className="change-list">
              {pipeline?.rewrite.changesApplied.length ? (
                pipeline.rewrite.changesApplied.map((change) => <li key={change}>{change}</li>)
              ) : (
                <li>No rewrite changes yet.</li>
              )}
            </ul>
          </SectionCard>
        </div>

        <div className="span-7">
          <SectionCard
            eyebrow="Rewrite Trace"
            title="Why this sounds like the profile"
            description="This is a user-facing transparency layer, not debug logging. It explains what Proxy changed and why."
          >
            <ul className="trace-list">
              {pipeline?.rewrite.trace.length ? (
                pipeline.rewrite.trace.map((entry, index) => (
                  <li key={`${entry.kind}-${entry.message}-${index}`} className="trace-item">
                    <span className="trace-kind">{entry.kind.replaceAll("_", " ")}</span>
                    <p>{entry.message}</p>
                  </li>
                ))
              ) : (
                <li className="trace-item trace-item-empty">
                  <p>Run the pipeline to inspect the rewrite trace.</p>
                </li>
              )}
            </ul>
          </SectionCard>
        </div>

        <div className="span-5">
          <SectionCard
            eyebrow="Validation"
            title="Validation report"
            description="Validation confirms the rewrite removed banned phrases and produced a usable result."
          >
            <div className="status-row">
              <span
                className={
                  pipeline?.validation.valid
                    ? "status-pill status-pill-valid"
                    : "status-pill status-pill-pending"
                }
              >
                {pipeline ? (pipeline.validation.valid ? "Valid" : "Needs review") : "Waiting"}
              </span>
            </div>
            <ul className="change-list">
              {pipeline ? (
                pipeline.validation.warnings.length > 0 ? (
                  pipeline.validation.warnings.map((warning) => <li key={warning}>{warning}</li>)
                ) : (
                  <li>No warnings.</li>
                )
              ) : (
                <li>Validation has not run yet.</li>
              )}
            </ul>
            {pipeline?.validation.violations.length ? (
              <ul className="change-list change-list-danger">
                {pipeline.validation.violations.map((violation) => (
                  <li key={violation}>{violation}</li>
                ))}
              </ul>
            ) : null}
          </SectionCard>
        </div>

        <div className="span-12">
          <SectionCard
            eyebrow="Final Output"
            title={`What ${APP_NAME} would show`}
            description={`${REPO_NAME} keeps the final user-facing output behind the rewrite and validation boundary.`}
          >
            <div className="form-actions final-actions">
              <button className="secondary-button" type="button" disabled={!pipeline} onClick={copyFinalOutput}>
                Copy Final Output
              </button>
            </div>
            <div className="output-panel output-panel-strong">
              {pipeline?.finalOutput ?? "No final output yet. Run the pipeline to produce one."}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
