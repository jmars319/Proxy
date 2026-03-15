import type { EscalationDecision, ValidationReport } from "@proxy/domain";
import type { ProviderId } from "@proxy/shared-types";

export interface OutputRule {
  id: string;
  effect: "allow" | "deny";
  match: string;
  reason: string;
}

export interface EscalationPolicy {
  allowCloudEscalation: boolean;
  preferredLocalProviderId?: ProviderId;
  fallbackCloudProviderId?: ProviderId;
}

export interface OutputPolicyResult {
  allowed: boolean;
  matchedRuleIds: string[];
  violations: string[];
}

/**
 * Capability routing and voice protection are different concerns.
 * A capable provider can still produce output that Proxy should reject.
 */
export const evaluateOutputRules = (
  text: string,
  rules: OutputRule[]
): OutputPolicyResult => {
  const matchedRules = rules.filter((rule) =>
    text.toLowerCase().includes(rule.match.toLowerCase())
  );

  const deniedRules = matchedRules.filter((rule) => rule.effect === "deny");

  return {
    allowed: deniedRules.length === 0,
    matchedRuleIds: matchedRules.map((rule) => rule.id),
    violations: deniedRules.map((rule) => rule.reason)
  };
};

export const decideEscalation = (
  requiresCloudCapability: boolean,
  policy: EscalationPolicy
): EscalationDecision => {
  if (!requiresCloudCapability) {
    return {
      decision: "stay-local",
      reason: "Local capability is sufficient for this request.",
      targetProviderId: policy.preferredLocalProviderId
    };
  }

  if (!policy.allowCloudEscalation) {
    return {
      decision: "deny",
      reason: "Cloud escalation is disabled by policy."
    };
  }

  return {
    decision: "escalate",
    reason: "The request exceeds current local capability and policy allows escalation.",
    targetProviderId: policy.fallbackCloudProviderId
  };
};

export const toValidationReport = (
  result: OutputPolicyResult,
  warnings: string[] = []
): ValidationReport => ({
  isValid: result.allowed,
  violations: result.violations,
  warnings,
  boundary: result.allowed ? "cloud-allowed" : "local-only"
});
