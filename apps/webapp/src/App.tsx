import { APP_NAME, readAppEnvironment, readProviderFeatureFlags } from "@proxy/config";
import { decideEscalation } from "@proxy/policy";
import { loadDefaultProfile } from "@proxy/profiles";
import { cloudProviderPlaceholder, localProviderPlaceholder, routeProvider } from "@proxy/providers";
import { runRewritePipeline } from "@proxy/rewrite-engine";
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
    "  Proxy treats upstream model output as draft material before it becomes user-facing language  ",
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

  return (
    <div className="page-shell">
      <header className="hero">
        <span className="eyebrow">Secondary Surface</span>
        <h1>{APP_NAME} on the web</h1>
        <p>
          The web app is intentionally lighter than desktop. Vite keeps it aligned with the
          Tauri renderer and avoids server scaffolding the repo does not need yet.
        </p>
      </header>

      <section className="grid">
        <SectionCard
          eyebrow="Core Promise"
          title="Voice stays local"
          description="Proxy exists to keep final output authority in local profiles, policies, and validation steps."
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
          description="Cloud adapters are placeholders until real provider integrations are justified."
        >
          <ul className="token-list">
            <li>OpenAI: {featureFlags.openai ? "configured" : "not configured"}</li>
            <li>Anthropic: {featureFlags.anthropic ? "configured" : "not configured"}</li>
            <li>Google: {featureFlags.google ? "configured" : "not configured"}</li>
            <li>Cloud escalation: {environment.allowCloudEscalation ? "enabled" : "disabled"}</li>
          </ul>
        </SectionCard>
      </section>
    </div>
  );
}
