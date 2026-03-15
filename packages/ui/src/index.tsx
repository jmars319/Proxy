import type { PropsWithChildren } from "react";

export const colorTokens = {
  canvas: "#f4efe7",
  surface: "rgba(255, 255, 255, 0.84)",
  surfaceStrong: "#ffffff",
  border: "rgba(35, 43, 51, 0.14)",
  ink: "#20272f",
  mutedInk: "#5b6772",
  accent: "#6a7b6a",
  accentSoft: "#dfe7db",
  warning: "#8b5d33"
} as const;

export const spacingTokens = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36
} as const;

export const typographyTokens = {
  sans: "\"Avenir Next\", \"IBM Plex Sans\", \"Segoe UI\", sans-serif",
  mono: "\"IBM Plex Mono\", \"SFMono-Regular\", monospace",
  displayWeight: 600,
  bodyWeight: 400
} as const;

export interface SectionCardProps extends PropsWithChildren {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function SectionCard({
  eyebrow,
  title,
  description,
  children
}: SectionCardProps) {
  return (
    <section
      style={{
        background: colorTokens.surface,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 24,
        padding: spacingTokens.lg,
        boxShadow: "0 20px 50px rgba(32, 39, 47, 0.08)",
        backdropFilter: "blur(18px)"
      }}
    >
      {eyebrow ? (
        <div
          style={{
            marginBottom: spacingTokens.sm,
            color: colorTokens.accent,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase"
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <h3
        style={{
          margin: 0,
          color: colorTokens.ink,
          fontSize: 22,
          fontWeight: typographyTokens.displayWeight
        }}
      >
        {title}
      </h3>
      {description ? (
        <p
          style={{
            marginTop: spacingTokens.sm,
            marginBottom: children ? spacingTokens.md : 0,
            color: colorTokens.mutedInk,
            lineHeight: 1.6
          }}
        >
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}
