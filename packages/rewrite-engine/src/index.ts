import type { RewriteReport, RewriteStepReport } from "@proxy/domain";

export interface RewriteContext {
  profileTone: string;
  hardConstraints: string[];
}

export interface RewriteStepResult {
  output: string;
  changed: boolean;
  note: string;
}

export interface RewriteStep {
  id: string;
  description: string;
  apply(input: string, context: RewriteContext): RewriteStepResult;
}

export const trimWhitespaceStep: RewriteStep = {
  id: "trim-whitespace",
  description: "Removes redundant outer whitespace.",
  apply(input) {
    const output = input.trim();
    return {
      output,
      changed: output !== input,
      note: "Normalized leading and trailing whitespace."
    };
  }
};

export const ensureTerminalPunctuationStep: RewriteStep = {
  id: "ensure-terminal-punctuation",
  description: "Keeps polished prose from ending abruptly.",
  apply(input) {
    const alreadyTerminated = /[.!?]$/.test(input);
    const output = alreadyTerminated ? input : `${input}.`;

    return {
      output,
      changed: output !== input,
      note: "Added sentence-ending punctuation when it was missing."
    };
  }
};

/**
 * Future model-assisted rewriting can join this pipeline later.
 * The local deterministic passes still provide a stable baseline.
 */
export const defaultRewriteSteps: RewriteStep[] = [
  trimWhitespaceStep,
  ensureTerminalPunctuationStep
];

export const runRewritePipeline = (
  input: string,
  context: RewriteContext,
  steps: RewriteStep[] = defaultRewriteSteps
): RewriteReport => {
  let current = input;
  const appliedSteps: RewriteStepReport[] = [];

  for (const step of steps) {
    const result = step.apply(current, context);
    current = result.output;
    appliedSteps.push({
      stepId: step.id,
      changed: result.changed,
      note: `${result.note} Tone target: ${context.profileTone}.`
    });
  }

  return {
    appliedSteps,
    summary: `${appliedSteps.filter((step) => step.changed).length} rewrite steps changed the draft.`,
    finalText: current
  };
};
