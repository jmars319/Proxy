import { Fragment, useState, type FormEvent } from "react";
import { APP_NAME, REPO_NAME } from "@proxy/config";
import type { RewriteReport, ValidationReport } from "@proxy/domain";
import { loadDefaultProfile } from "@proxy/profiles";
import { MockProvider } from "@proxy/providers";
import { rewriteDraft } from "@proxy/rewrite-engine";
import { SectionCard } from "@proxy/ui";
import { validateRewrittenOutput } from "@proxy/validation";

const defaultPrompt =
  "Explain why clear communication matters when using AI tools for everyday work.";
const profile = loadDefaultProfile();
const provider = new MockProvider();

interface PipelineSnapshot {
  prompt: string;
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
      ? `${pipeline.rewrite.changesApplied.length} changes applied using the active profile.`
      : "Deterministic local rewrite pass."
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
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [pipeline, setPipeline] = useState<PipelineSnapshot | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const rewrite = rewriteDraft(draft.text, profile);
      const validation = validateRewrittenOutput(rewrite.rewritten, profile);

      setPipeline({
        prompt: trimmedPrompt,
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

  const stages = buildPipelineStages(prompt, pipeline);

  return (
    <div className="workspace-shell">
      <header className="workspace-hero">
        <div className="hero-copy">
          <span className="eyebrow">Proxy v0.1</span>
          <h1>First end-to-end rewrite pipeline</h1>
          <p>
            Prompt in. Generic provider draft out. Then Proxy rewrites it with the active voice
            profile, validates it, and only then shows the final result.
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
                <span className="microcopy">
                  {pipeline
                    ? `${pipeline.latencyMs}ms mock provider latency`
                    : "Mock provider only. No real model calls yet."}
                </span>
              </div>
            </form>
            {error ? <p className="error-banner">{error}</p> : null}
          </SectionCard>
        </div>

        <div className="span-7">
          <SectionCard
            eyebrow="Active Profile"
            title={profile.metadata.name}
            description="The profile owns the rewrite tone and the constraints that must survive the provider handoff."
          >
            <dl className="detail-stack">
              <div>
                <dt>Tone</dt>
                <dd>{profile.tone}</dd>
              </div>
              <div>
                <dt>Banned phrases</dt>
                <dd>{profile.bannedPhrases.join(", ")}</dd>
              </div>
              <div>
                <dt>Style rules</dt>
                <dd>{profile.styleRules.join(", ")}</dd>
              </div>
            </dl>
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
            description="The rewrite pass removes banned phrases, strips apology language, and tightens wording."
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

        <div className="span-4">
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

        <div className="span-8">
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
