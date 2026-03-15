import type {
  RewriteReport,
  RewriteStepReport,
  RewriteTraceEntry,
  VoiceProfile
} from "@proxy/domain";

export interface RewriteContext {
  profileTone: string;
  hardConstraints: string[];
  bannedPhrases?: string[];
  styleRules?: string[];
}

export interface RewriteStepResult {
  output: string;
  changed: boolean;
  note: string;
  traceEntries: RewriteTraceEntry[];
}

export interface RewriteStep {
  id: string;
  description: string;
  apply(input: string, context: RewriteContext): RewriteStepResult;
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cleanText = (input: string): string =>
  input
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s+\1/g, "$1")
    .replace(/([.!?])\s*[,;:]\s*/g, "$1 ")
    .replace(/[,;:]\s*([.!?])/g, "$1")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([.!?]){2,}/g, "$1")
    .trim();

const createTraceEntry = (
  kind: RewriteTraceEntry["kind"],
  message: string
): RewriteTraceEntry => ({
  kind,
  message
});

const capitalizeSentences = (input: string): string => {
  const trimmed = cleanText(input);

  if (!trimmed) {
    return trimmed;
  }

  return trimmed
    .replace(/(^\w)/, (match) => match.toUpperCase())
    .replace(/([.!?]\s+)([a-z])/g, (_match, prefix: string, letter: string) => {
      return `${prefix}${letter.toUpperCase()}`;
    });
};

export const trimWhitespaceStep: RewriteStep = {
  id: "trim-whitespace",
  description: "Removes redundant outer whitespace.",
  apply(input) {
    const output = cleanText(input);
    return {
      output,
      changed: output !== input,
      note: "Normalized leading and trailing whitespace.",
      traceEntries: output !== input
        ? [createTraceEntry("structure_change", "Cleaned up spacing before applying profile rules.")]
        : []
    };
  }
};

export const removeBannedPhrasesStep: RewriteStep = {
  id: "remove-banned-phrases",
  description: "Strips phrases the active voice profile does not allow.",
  apply(input, context) {
    const bannedPhrases = context.bannedPhrases ?? [];
    let output = input;
    const removedPhrases = bannedPhrases.filter((phrase) => {
      const expression = new RegExp(escapeRegExp(phrase), "gi");
      const nextOutput = output.replace(expression, "");
      const changed = nextOutput !== output;
      output = nextOutput;
      return changed;
    });

    output = cleanText(output);

    return {
      output,
      changed: removedPhrases.length > 0,
      note:
        removedPhrases.length > 0
          ? `Removed banned phrases: ${removedPhrases.join(", ")}.`
          : "No banned phrases were present.",
      traceEntries: removedPhrases.map((phrase) =>
        createTraceEntry("removed_phrase", `Removed banned phrase: "${phrase}".`)
      )
    };
  }
};

export const removeApologyLanguageStep: RewriteStep = {
  id: "remove-apology-language",
  description: "Removes apology language that weakens the output unnecessarily.",
  apply(input) {
    const output = cleanText(
      input
        .replace(/\bI apologize\b[:,]?\s*/gi, "")
        .replace(/\bI'?m sorry\b[:,]?\s*/gi, "")
        .replace(/\bsorry\b[:,]?\s*/gi, "")
    );

    return {
      output,
      changed: output !== input,
      note: "Removed apology language.",
      traceEntries:
        output !== input
          ? [
              createTraceEntry(
                "removed_phrase",
                "Removed apology language to keep the response calm and direct."
              )
            ]
          : []
    };
  }
};

export const alignToneStep: RewriteStep = {
  id: "align-tone",
  description: "Softens overly excited phrasing so the tone stays measured.",
  apply(input, context) {
    const avoidSalesyEnthusiasm = (context.styleRules ?? []).some((rule) =>
      rule.toLowerCase().includes("salesy enthusiasm")
    );

    let output = input.replace(/!/g, ".");

    if (avoidSalesyEnthusiasm) {
      output = output.replace(/\b(amazing|incredible|exciting)\b/gi, "");
    }

    output = cleanText(output);

    return {
      output,
      changed: output !== input,
      note: output !== input ? "Shifted the tone toward the active profile." : "Tone already felt aligned.",
      traceEntries:
        output !== input
          ? [
              createTraceEntry(
                "tone_shift",
                `Shifted tone toward profile: ${context.profileTone}.`
              )
            ]
          : []
    };
  }
};

export const tightenWordingStep: RewriteStep = {
  id: "tighten-wording",
  description: "Cuts generic lead-ins and filler phrases.",
  apply(input, context) {
    const avoidFiller = (context.styleRules ?? []).some((rule) =>
      rule.toLowerCase().includes("avoid filler")
    );

    const hadGenericOpening =
      /^sure[.!]?\s*here(?:'s| is) a helpful response to your question:\s*/i.test(input) ||
      /^here(?:'s| is) a helpful response to your question:\s*/i.test(input) ||
      /^sure[.!]?\s*/i.test(input);
    const hadFillerWords = /\b(helpful|really|basically|just)\b/i.test(input);

    let output = input
      .replace(/^sure[.!]?\s*/i, "")
      .replace(/^here(?:'s| is) a helpful response to your question:\s*/i, "")
      .replace(/^sure[.!]?\s*here(?:'s| is) a helpful response to your question:\s*/i, "");

    if (avoidFiller) {
      output = output
        .replace(/\b(helpful|really|basically|just)\b/gi, "")
        .replace(/\s{2,}/g, " ");
    }

    output = cleanText(output);

    return {
      output,
      changed: output !== input,
      note: avoidFiller
        ? "Tightened filler-heavy wording."
        : "Normalized generic lead-in wording.",
      traceEntries:
        output !== input
          ? [
              hadGenericOpening
                ? createTraceEntry(
                    "tightened_wording",
                    "Tightened overly generic opening."
                  )
                : createTraceEntry(
                    "tightened_wording",
                    hadFillerWords
                      ? "Tightened filler-heavy wording."
                      : "Tightened wording to keep the response direct."
                  )
            ]
          : []
    };
  }
};

export const preferShortSentencesStep: RewriteStep = {
  id: "prefer-short-sentences",
  description: "Breaks up longer clauses into shorter sentences when the profile asks for it.",
  apply(input, context) {
    const prefersShortSentences = (context.styleRules ?? []).some((rule) =>
      rule.toLowerCase().includes("short sentences")
    );

    if (!prefersShortSentences) {
      return {
        output: input,
        changed: false,
        note: "Profile does not request short-sentence tightening.",
        traceEntries: []
      };
    }

    const output = capitalizeSentences(
      input
        .replace(/\bthe clearest next step is to focus on\b/gi, "Focus on")
        .replace(/,\s+remove extra filler/gi, ". Remove extra filler")
        .replace(/,\s+(and|but|so)\s+/gi, ". ")
        .replace(/\bthe clearest next step is to\b/gi, "Start by")
    );

    return {
      output,
      changed: output !== input,
      note: "Split longer clauses into shorter sentences.",
      traceEntries:
        output !== input
          ? [
              createTraceEntry(
                "structure_change",
                "Shortened a long sentence to match the profile's preference for short sentences."
              )
            ]
          : []
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
      note: "Added sentence-ending punctuation when it was missing.",
      traceEntries: []
    };
  }
};

/**
 * Future model-assisted rewriting can join this pipeline later.
 * The local deterministic passes still provide a stable baseline.
 */
export const defaultRewriteSteps: RewriteStep[] = [
  trimWhitespaceStep,
  removeBannedPhrasesStep,
  removeApologyLanguageStep,
  alignToneStep,
  tightenWordingStep,
  preferShortSentencesStep,
  ensureTerminalPunctuationStep
];

export const createRewriteContext = (profile: VoiceProfile): RewriteContext => ({
  profileTone: profile.tone,
  hardConstraints: profile.hardConstraints,
  bannedPhrases: profile.bannedPhrases,
  styleRules: profile.styleRules
});

export const runRewritePipeline = (
  input: string,
  context: RewriteContext,
  steps: RewriteStep[] = defaultRewriteSteps
): RewriteReport => {
  let current = input;
  const appliedSteps: RewriteStepReport[] = [];
  const trace: RewriteTraceEntry[] = [];

  for (const step of steps) {
    const result = step.apply(current, context);
    current = result.output;
    trace.push(...result.traceEntries);
    appliedSteps.push({
      stepId: step.id,
      changed: result.changed,
      note: `${result.note} Tone target: ${context.profileTone}.`
    });
  }

  return {
    original: input,
    rewritten: current,
    changesApplied:
      trace.length > 0
        ? trace.map((entry) => entry.message)
        : appliedSteps.filter((step) => step.changed).map((step) => step.note),
    trace,
    appliedSteps,
    summary:
      trace.length > 0
        ? `${trace.length} user-facing rewrite notes explain how the draft was aligned to the profile.`
        : `${appliedSteps.filter((step) => step.changed).length} rewrite steps changed the draft.`,
    finalText: current
  };
};

export const rewriteDraft = (input: string, profile: VoiceProfile): RewriteReport =>
  runRewritePipeline(input, createRewriteContext(profile));
