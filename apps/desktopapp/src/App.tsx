import { Fragment, useState, type FormEvent } from "react";
import { APP_NAME, REPO_NAME } from "@proxy/config";
import type { RewriteReport, ValidationReport, VoiceProfile } from "@proxy/domain";
import { DEFAULT_PROFILE_ARTIFACT_PATH, loadDefaultProfile } from "@proxy/profiles";
import { MockProvider } from "@proxy/providers";
import {
  runProfileTests,
  type ProfileTestReport
} from "@proxy/rewrite-engine/profile-tests";
import { rewriteDraft } from "@proxy/rewrite-engine";
import { SectionCard } from "@proxy/ui";
import { validateRewrittenOutput } from "@proxy/validation";

const defaultPrompt =
  "Explain why clear communication matters when using AI tools for everyday work.";
const provider = new MockProvider();

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

const getFinalOutput = (rewrite: RewriteReport, validation: ValidationReport): string =>
  validation.valid ? rewrite.rewritten : "Validation blocked the rewritten output.";

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
    text: pipeline?.rawDraft ?? "Run the pipeline to generate a raw provider draft.",
    note: `${provider.descriptor.label} simulates upstream capability.`
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
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [pipeline, setPipeline] = useState<PipelineSnapshot | null>(null);
  const [profileTestReport, setProfileTestReport] = useState<ProfileTestReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isRunningProfileTests, setIsRunningProfileTests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileTestError, setProfileTestError] = useState<string | null>(null);

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
      const profile = loadDefaultProfile();
      const rewrite = rewriteDraft(draft.text, profile);
      const validation = validateRewrittenOutput(rewrite.rewritten, profile);

      setPipeline({
        prompt: trimmedPrompt,
        profile,
        rawDraft: draft.text,
        rewrite,
        validation,
        finalOutput: getFinalOutput(rewrite, validation),
        latencyMs: draft.latencyMs
      });
    } catch {
      setError("The mock pipeline failed unexpectedly.");
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

  const activeProfile = pipeline?.profile ?? defaultProfile;
  const stages = buildPipelineStages(prompt, activeProfile, pipeline);

  return (
    <div className="workspace-shell">
      <header className="workspace-hero">
        <div className="hero-copy">
          <span className="eyebrow">Proxy v0.2</span>
          <h1>Rewrite trace and portable profile artifacts</h1>
          <p>
            Prompt in. Generic provider draft out. Then Proxy rewrites it with the active voice
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
            description="This slice proves the product boundary: provider output is only draft material until Proxy rewrites and validates it."
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
                placeholder="Describe the response you want Proxy to process."
              />
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
                    ? `${pipeline.latencyMs}ms mock provider latency`
                    : "Mock provider only. No real model calls yet."}
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
            description="Profiles are portable artifacts. Proxy loads the artifact, validates it, then turns it into the richer domain shape used by the rewrite pipeline."
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
            eyebrow="Profile Tests"
            title="Behavior checks for the active profile"
            description="Fixtures verify that the profile still shapes rewrite behavior the way Proxy expects, without locking to exact output text."
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
              {pipeline?.rawDraft ?? "Run the pipeline to inspect the mock provider draft."}
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
                  <p>Run the pipeline to inspect the human-readable rewrite trace.</p>
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
            <div className="output-panel output-panel-strong">
              {pipeline?.finalOutput ?? "No final output yet. Run the pipeline to produce one."}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
