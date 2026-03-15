import { useState } from "react";
import { APP_NAME, REPO_NAME, readAppEnvironment, readProviderFeatureFlags } from "@proxy/config";
import { toValidationReport, decideEscalation, evaluateOutputRules } from "@proxy/policy";
import { describeBoundaryTransition, maskSecret } from "@proxy/privacy";
import { defaultProfileDocument, formatProfileFilename } from "@proxy/profiles";
import {
  MockProvider,
  cloudProviderPlaceholder,
  localProviderPlaceholder,
  routeProvider
} from "@proxy/providers";
import { defaultRewriteSteps, runRewritePipeline } from "@proxy/rewrite-engine";
import { SectionCard, colorTokens, typographyTokens } from "@proxy/ui";
import { providerConfigSchema } from "@proxy/validation";

type ScreenKey = "workspace" | "profiles" | "providers" | "settings" | "diagnostics";

const navigationItems: Array<{ key: ScreenKey; label: string; summary: string }> = [
  {
    key: "workspace",
    label: "Workspace",
    summary: "Rewrite, validate, and route model output."
  },
  {
    key: "profiles",
    label: "Profiles",
    summary: "Voice authority lives in local-first profile artifacts."
  },
  {
    key: "providers",
    label: "Providers",
    summary: "Capability routing stays separate from policy."
  },
  {
    key: "settings",
    label: "Settings",
    summary: "Local paths, cloud escalation, and environment flags."
  },
  {
    key: "diagnostics",
    label: "Diagnostics",
    summary: "Boundary checks and scaffold health signals."
  }
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("workspace");
  const profile = defaultProfileDocument.profile;
  const environment = readAppEnvironment(
    import.meta.env as unknown as Record<string, string | undefined>
  );
  const featureFlags = readProviderFeatureFlags(
    import.meta.env as unknown as Record<string, string | undefined>
  );
  const mockProvider = new MockProvider();
  const rewriteReport = runRewritePipeline(
    "  Capability can come from any upstream model while local voice authority remains in control  ",
    {
      profileTone: profile.tone,
      hardConstraints: profile.hardConstraints
    }
  );
  const policyResult = evaluateOutputRules(rewriteReport.finalText, [
    {
      id: "no-guarantees",
      effect: "deny",
      match: "guaranteed",
      reason: "Absolute guarantees should not reach the user unchecked."
    }
  ]);
  const validationReport = toValidationReport(policyResult, [
    "Provider adapters are scaffolded, not production-ready."
  ]);
  const escalationDecision = decideEscalation(false, {
    allowCloudEscalation: environment.allowCloudEscalation,
    preferredLocalProviderId: localProviderPlaceholder.id,
    fallbackCloudProviderId: cloudProviderPlaceholder.id
  });
  const routingPreview = routeProvider(
    localProviderPlaceholder.id,
    "local",
    "Desktop defaults to the local placeholder provider in v0.",
    cloudProviderPlaceholder.id
  );
  const providerConfigPreview = providerConfigSchema.parse({
    id: localProviderPlaceholder.id,
    label: localProviderPlaceholder.label,
    mode: localProviderPlaceholder.mode,
    enabled: localProviderPlaceholder.enabled
  });
  const boundaryPreview = describeBoundaryTransition("local-device", "cloud-provider");

  const renderScreen = () => {
    switch (activeScreen) {
      case "workspace":
        return (
          <div className="screen-grid">
            <SectionCard
              eyebrow="Rewrite Flow"
              title="Local voice authority is the product boundary"
              description="Upstream output should land as a draft, then move through profile-aware rewriting and validation before the user sees it."
            >
              <dl className="detail-list">
                <div>
                  <dt>Active profile</dt>
                  <dd>{profile.metadata.name}</dd>
                </div>
                <div>
                  <dt>Provider route</dt>
                  <dd>{routingPreview.reason}</dd>
                </div>
                <div>
                  <dt>Rewrite steps</dt>
                  <dd>{defaultRewriteSteps.map((step) => step.id).join(", ")}</dd>
                </div>
              </dl>
            </SectionCard>
            <SectionCard
              eyebrow="Draft Preview"
              title="Deterministic rewrite pass"
              description="This starter pass is intentionally simple so the repo has a real local rewrite seam on day one."
            >
              <div className="callout">{rewriteReport.finalText}</div>
              <ul className="pill-list">
                {rewriteReport.appliedSteps.map((step) => (
                  <li key={step.stepId}>
                    {step.stepId}: {step.changed ? "changed" : "unchanged"}
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard
              eyebrow="Validation"
              title="Policy outcome"
              description="Capability routing and output policy are scaffolded as separate responsibilities."
            >
              <dl className="detail-list">
                <div>
                  <dt>Valid</dt>
                  <dd>{validationReport.isValid ? "yes" : "no"}</dd>
                </div>
                <div>
                  <dt>Escalation</dt>
                  <dd>{escalationDecision.decision}</dd>
                </div>
                <div>
                  <dt>Warnings</dt>
                  <dd>{validationReport.warnings.join(" ")}</dd>
                </div>
              </dl>
            </SectionCard>
          </div>
        );
      case "profiles":
        return (
          <div className="screen-grid">
            <SectionCard
              eyebrow="Profile Artifact"
              title={profile.metadata.name}
              description={profile.metadata.description}
            >
              <dl className="detail-list">
                <div>
                  <dt>File name</dt>
                  <dd>{formatProfileFilename(profile.metadata.name)}</dd>
                </div>
                <div>
                  <dt>Tone</dt>
                  <dd>{profile.tone}</dd>
                </div>
                <div>
                  <dt>Audience</dt>
                  <dd>{profile.audience}</dd>
                </div>
              </dl>
            </SectionCard>
            <SectionCard
              eyebrow="Rewrite Directives"
              title="Profile-owned instructions"
              description="These directives belong in shared profile artifacts, not in app-local view code."
            >
              <ul className="stack-list">
                {profile.rewriteDirectives.map((directive) => (
                  <li key={directive}>{directive}</li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard
              eyebrow="Hard Constraints"
              title="Constraints stay ahead of delivery"
              description="Constraint enforcement is part of the product contract, not a downstream afterthought."
            >
              <ul className="stack-list">
                {profile.hardConstraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </SectionCard>
          </div>
        );
      case "providers":
        return (
          <div className="screen-grid">
            <SectionCard
              eyebrow="Default Route"
              title={mockProvider.descriptor.label}
              description="Provider adapters are thin capability layers behind policy and rewrite ownership."
            >
              <dl className="detail-list">
                <div>
                  <dt>Mode</dt>
                  <dd>{mockProvider.descriptor.mode}</dd>
                </div>
                <div>
                  <dt>Fallback</dt>
                  <dd>{routingPreview.fallbackProviderId ?? "none"}</dd>
                </div>
                <div>
                  <dt>Schema check</dt>
                  <dd>{providerConfigPreview.label}</dd>
                </div>
              </dl>
            </SectionCard>
            <SectionCard
              eyebrow="Cloud Status"
              title="Feature flags stay explicit"
              description="Cloud providers are placeholders until a local-first flow decides they are needed."
            >
              <ul className="pill-list">
                <li>Local providers: {featureFlags.localProviders ? "enabled" : "disabled"}</li>
                <li>OpenAI: {featureFlags.openai ? "configured" : "not configured"}</li>
                <li>Anthropic: {featureFlags.anthropic ? "configured" : "not configured"}</li>
                <li>Google: {featureFlags.google ? "configured" : "not configured"}</li>
              </ul>
            </SectionCard>
            <SectionCard
              eyebrow="Policy Boundary"
              title="Escalation is a separate decision"
              description="A capable cloud model should never override the local profile's authority."
            >
              <p className="inline-note">
                {escalationDecision.reason}
              </p>
            </SectionCard>
          </div>
        );
      case "settings":
        return (
          <div className="screen-grid">
            <SectionCard
              eyebrow="Environment"
              title="Local-first defaults"
              description="The scaffold keeps settings light until real storage and profile management are implemented."
            >
              <dl className="detail-list">
                <div>
                  <dt>App</dt>
                  <dd>{environment.appName}</dd>
                </div>
                <div>
                  <dt>Mode</dt>
                  <dd>{environment.appEnv}</dd>
                </div>
                <div>
                  <dt>Cloud escalation</dt>
                  <dd>{environment.allowCloudEscalation ? "allowed" : "disabled"}</dd>
                </div>
              </dl>
            </SectionCard>
            <SectionCard
              eyebrow="Paths"
              title="Storage placeholders"
              description="These values are intentionally light until the storage package grows real adapters."
            >
              <dl className="detail-list">
                <div>
                  <dt>Profiles path</dt>
                  <dd>{environment.localProfilePath ?? "Not set"}</dd>
                </div>
                <div>
                  <dt>Storage path</dt>
                  <dd>{environment.localStoragePath ?? "Not set"}</dd>
                </div>
                <div>
                  <dt>Default provider</dt>
                  <dd>{environment.defaultProvider ?? localProviderPlaceholder.id}</dd>
                </div>
              </dl>
            </SectionCard>
            <SectionCard
              eyebrow="Intent"
              title="Desktop is the primary surface"
              description="Settings here should eventually orchestrate shared packages rather than absorb their logic."
            />
          </div>
        );
      case "diagnostics":
        return (
          <div className="screen-grid">
            <SectionCard
              eyebrow="Boundary Check"
              title="Cross-boundary movement stays explicit"
              description="The privacy package seeds the vocabulary for local, cloud, and redacted flows."
            >
              <dl className="detail-list">
                <div>
                  <dt>Transition</dt>
                  <dd>
                    {boundaryPreview.source} to {boundaryPreview.target}
                  </dd>
                </div>
                <div>
                  <dt>Allowed</dt>
                  <dd>{boundaryPreview.allowed ? "yes" : "requires decision"}</dd>
                </div>
                <div>
                  <dt>Masked token</dt>
                  <dd>{maskSecret("proxy-local-token-demo", 5)}</dd>
                </div>
              </dl>
            </SectionCard>
            <SectionCard
              eyebrow="Scaffold Health"
              title="What is real today"
              description="This repo seeds durable boundaries now so future work has an obvious home."
            >
              <ul className="stack-list">
                <li>Workspace packages are wired and imported by the app shell.</li>
                <li>Rewrite and policy layers have deterministic starter behavior.</li>
                <li>Provider adapters and storage remain placeholder-first.</li>
              </ul>
            </SectionCard>
            <SectionCard
              eyebrow="Branding"
              title={REPO_NAME}
              description={`Desktop shell for ${APP_NAME}, using shared tokens from packages/ui.`}
            >
              <p className="inline-note" style={{ color: colorTokens.mutedInk, fontFamily: typographyTokens.sans }}>
                Calm UI first. No chat chrome, no terminal posture, no fake neon confidence.
              </p>
            </SectionCard>
          </div>
        );
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-kicker">Proxy by JAMARQ</span>
          <h1>{APP_NAME}</h1>
          <p>
            Local-first voice authority layered on top of interchangeable upstream capability.
          </p>
        </div>
        <nav className="nav-list" aria-label="Primary">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              className={item.key === activeScreen ? "nav-item nav-item-active" : "nav-item"}
              type="button"
              onClick={() => setActiveScreen(item.key)}
            >
              <strong>{item.label}</strong>
              <span>{item.summary}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="content">
        <header className="hero">
          <div>
            <span className="hero-kicker">Desktop Primary Surface</span>
            <h2>Thin shell on top of shared packages</h2>
          </div>
          <div className="hero-badges">
            <span>Rewrite local</span>
            <span>Validate before display</span>
            <span>Route capability deliberately</span>
          </div>
        </header>
        {renderScreen()}
      </main>
    </div>
  );
}
