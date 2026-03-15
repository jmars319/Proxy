/**
 * Local-first storage and data minimization are product-level decisions, not
 * implementation details.
 */
export type DataBoundary = "local-device" | "cloud-provider" | "redacted-export";

export interface BoundaryDecision {
  source: DataBoundary;
  target: DataBoundary;
  allowed: boolean;
  reason: string;
}

export const maskSecret = (value: string, visibleSuffix = 4): string => {
  if (!value) {
    return "";
  }

  if (value.length <= visibleSuffix) {
    return "*".repeat(value.length);
  }

  return `${"*".repeat(value.length - visibleSuffix)}${value.slice(-visibleSuffix)}`;
};

export const redactText = (input: string, tokens: string[]): string =>
  tokens.reduce((output, token) => output.replaceAll(token, "[REDACTED]"), input);

export const describeBoundaryTransition = (
  source: DataBoundary,
  target: DataBoundary
): BoundaryDecision => ({
  source,
  target,
  allowed: source === target || target !== "cloud-provider",
  reason:
    source === target
      ? "Data stays within the same boundary."
      : "Cross-boundary movement should be explicit and minimized."
});
