import { APP_NAME, readAppEnvironment, readProviderFeatureFlags } from "@proxy/config";
import { decideEscalation } from "@proxy/policy";
import { loadDefaultProfile } from "@proxy/profiles";
import { cloudProviderPlaceholder, localProviderPlaceholder, routeProvider } from "@proxy/providers";
import { runRewritePipeline } from "@proxy/rewrite-engine";
import { shapeExternalOutput } from "@proxy/rewrite-engine/suite-shaping";
import { SectionCard } from "@proxy/ui";

export default function App() {
  const environment = readAppEnvironment(
    import.meta.env as unknown as Record<string, string | undefined>
  );
  const featureFlags = readProviderFeatureFlags(
    import.meta.env as unknown as Record<string, string | undefined>
  );
  const profile = loadDefaultProfile();
  const rewritePreview = runRewritePipeline(
    "  tenra Proxy treats upstream model output as draft material before it becomes user-facing language  ",
    {
      profileTone: profile.tone,
      hardConstraints: profile.hardConstraints
    }
  );
  const routingPreview = routeProvider(
    localProviderPlaceholder.id,
    "local",
    "Web stays thin and leans on the same shared packages as desktop.",
    cloudProviderPlaceholder.id
  );
  const escalationPreview = decideEscalation(true, {
    allowCloudEscalation: environment.allowCloudEscalation,
    preferredLocalProviderId: localProviderPlaceholder.id,
    fallbackCloudProviderId: cloudProviderPlaceholder.id
  });
  const guardrailShape = shapeExternalOutput(
    {
      clientApp: "guardrail",
      surface: "moderation-note",
      profileId: profile.metadata.id,
      purpose: "Summarize why a requested external action needs human review.",
      draftText: "A suite app wants to send a customer-facing document with unresolved evidence.",
      hardConstraints: ["Do not approve the action", "Name the review reason plainly"],
      traceId: "proxy-web-guardrail-demo"
    },
    profile
  );
  const partitionShape = shapeExternalOutput(
    {
      clientApp: "partition",
      surface: "operator-brief",
      profileId: profile.metadata.id,
      purpose: "Explain a read-only validation request without implying disk execution is available.",
      draftText: "The lab request can be exported for disposable-image validation. Execution remains disabled.",
      hardConstraints: ["Use read-only language", "Keep destructive action locked"],
      traceId: "proxy-web-partition-demo"
    },
    profile
  );

  return (
    <div className="page-shell">
      <header className="hero">
        <span className="eyebrow">Web channel</span>
        <h1>{APP_NAME} on the web</h1>
        <p>
          The web app mirrors the shared profile, policy, and routing model used by the desktop product.
        </p>
      </header>

      <section className="grid">
        <SectionCard
          eyebrow="Core Promise"
          title="Voice stays local"
          description="tenra Proxy exists to keep final output authority in local profiles, policies, and validation steps."
        >
          <div className="callout">{rewritePreview.finalText}</div>
        </SectionCard>

        <SectionCard
          eyebrow="Profile Preview"
          title={profile.metadata.name}
          description={profile.metadata.description}
        >
          <ul className="token-list">
            {profile.rewriteDirectives.map((directive) => (
              <li key={directive}>{directive}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          eyebrow="Routing"
          title="Provider capability remains swappable"
          description="Routing, escalation, and rewrite ownership are deliberately separate."
        >
          <dl className="detail-list">
            <div>
              <dt>Route</dt>
              <dd>{routingPreview.reason}</dd>
            </div>
            <div>
              <dt>Escalation</dt>
              <dd>{escalationPreview.decision}</dd>
            </div>
            <div>
              <dt>Fallback</dt>
              <dd>{routingPreview.fallbackProviderId ?? "not set"}</dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard
          eyebrow="Status"
          title="Configured capabilities"
          description="Provider integrations stay separated from profile ownership and validation."
        >
          <ul className="token-list">
            <li>OpenAI: {featureFlags.openai ? "configured" : "not configured"}</li>
            <li>Anthropic: {featureFlags.anthropic ? "configured" : "not configured"}</li>
            <li>Google: {featureFlags.google ? "configured" : "not configured"}</li>
            <li>Cloud escalation: {environment.allowCloudEscalation ? "enabled" : "disabled"}</li>
          </ul>
        </SectionCard>

        <SectionCard
          eyebrow="Suite Shaping"
          title="Guardrail and Partition handoffs"
          description="External outputs now use the same local profile before another app receives the text."
        >
          <dl className="detail-list">
            <div>
              <dt>Moderation note</dt>
              <dd>{guardrailShape.text}</dd>
            </div>
            <div>
              <dt>Operator brief</dt>
              <dd>{partitionShape.text}</dd>
            </div>
          </dl>
        </SectionCard>
      </section>
    </div>
  );
}
