import {
  APP_NAME,
  readAppEnvironment,
  readProviderFeatureFlags,
  readSuiteProfilePresetOverrides,
  type SuiteProfilePresetOverrides
} from "@proxy/config";
import { decideEscalation } from "@proxy/policy";
import { loadDefaultProfile } from "@proxy/profiles";
import { cloudProviderPlaceholder, localProviderPlaceholder, routeProvider } from "@proxy/providers";
import type { ShapeExternalOutputRequest } from "@proxy/api-contracts";
import { runRewritePipeline } from "@proxy/rewrite-engine";
import {
  buildShapeExternalOutputRequestFromPreset,
  shapeExternalOutput,
  suiteShapingPresets
} from "@proxy/rewrite-engine/suite-shaping";
import { SectionCard } from "@proxy/ui";
import { useEffect, useState } from "react";

const visibleSuitePresetIds = [
  "scout-outreach",
  "guardrail-review",
  "partition-operator-brief",
  "assembly-document-note"
] as const;

export default function App() {
  const environment = readAppEnvironment(
    import.meta.env as unknown as Record<string, string | undefined>
  );
  const featureFlags = readProviderFeatureFlags(
    import.meta.env as unknown as Record<string, string | undefined>
  );
  const profile = loadDefaultProfile();
  const [suiteOverrides, setSuiteOverrides] = useState<SuiteProfilePresetOverrides>(() =>
    readSuiteProfilePresetOverrides(import.meta.env as unknown as Record<string, string | undefined>)
  );
  const [profileStoreNotice, setProfileStoreNotice] = useState("Profile overrides loaded from environment.");
  const [suiteHealth, setSuiteHealth] = useState<Record<string, unknown> | null>(null);
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
  const suitePresetShapes = visibleSuitePresetIds.map((presetId) => {
    const presetRequest = buildShapeExternalOutputRequestFromPreset(
      {
        presetId,
        draftText:
          presetId === "scout-outreach"
            ? "Scout found a qualified opportunity. Evidence includes a recent permit filing and a public expansion note."
            : presetId === "guardrail-review"
              ? "A suite app wants to send a customer-facing document with unresolved evidence."
              : presetId === "partition-operator-brief"
                ? "The lab request can be exported for disposable-image validation. Execution remains disabled."
                : "Registry sent a document request. Assembly should keep it as a draft until content review completes.",
        traceId: `proxy-web-${presetId}`
      },
      profile.metadata.id
    );
    const override = suiteOverrides[presetId] ?? suiteOverrides[presetRequest.clientApp];
    const request = {
      ...presetRequest,
      profileId: (override?.profileId ?? presetRequest.profileId) as ShapeExternalOutputRequest["profileId"],
      hardConstraints: [...presetRequest.hardConstraints, ...(override?.hardConstraints ?? [])]
    };

    return {
      presetId,
      preset: suiteShapingPresets[presetId],
      override,
      result: shapeExternalOutput(request, profile)
    };
  });

  function updateSuiteOverride(
    presetId: (typeof visibleSuitePresetIds)[number],
    update: { profileId?: string; hardConstraintsText?: string }
  ) {
    setSuiteOverrides((current) => ({
      ...current,
      [presetId]: {
        profileId: update.profileId,
        hardConstraints: update.hardConstraintsText
          ?.split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      }
    }));
  }

  async function copySuiteOverrides() {
    await navigator.clipboard.writeText(JSON.stringify(suiteOverrides, null, 2));
  }

  async function saveSuiteOverrides() {
    const response = await fetch("/api/suite-profile-overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overrides: suiteOverrides })
    });
    const body = (await response.json()) as { ok?: boolean; errors?: string[]; overrides?: SuiteProfilePresetOverrides };
    if (!response.ok || !body.ok) {
      setProfileStoreNotice(body.errors?.join(", ") ?? "Profile override save failed.");
      return;
    }
    setSuiteOverrides(body.overrides ?? suiteOverrides);
    setProfileStoreNotice("Profile overrides saved to the local Proxy profile store.");
  }

  useEffect(() => {
    void fetch("/api/suite-profile-overrides")
      .then((response) => response.json())
      .then((body: { ok?: boolean; overrides?: SuiteProfilePresetOverrides }) => {
        if (body.ok && body.overrides) {
          setSuiteOverrides((current) => ({ ...current, ...body.overrides }));
          setProfileStoreNotice("Profile overrides loaded from the local Proxy profile store.");
        }
      })
      .catch(() => setProfileStoreNotice("Profile override API is unavailable in this build."));

    void fetch("/api/suite-health")
      .then((response) => response.json())
      .then((body: Record<string, unknown>) => setSuiteHealth(body))
      .catch(() => setSuiteHealth({ ok: false, error: "Suite health endpoint unavailable." }));
  }, []);

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
          description="Provider integrations stay separated from profile ownership, validation, and delivery health."
        >
          <ul className="token-list">
            <li>OpenAI: {featureFlags.openai ? "configured" : "not configured"}</li>
            <li>Anthropic: {featureFlags.anthropic ? "configured" : "not configured"}</li>
            <li>Google: {featureFlags.google ? "configured" : "not configured"}</li>
            <li>Cloud escalation: {environment.allowCloudEscalation ? "enabled" : "disabled"}</li>
            <li>Suite health: {suiteHealth?.ok ? "available" : "unavailable"}</li>
          </ul>
        </SectionCard>

        <SectionCard
          eyebrow="Suite Shaping"
          title="Suite handoff presets"
          description="External outputs now use the same local profile before another app receives the text."
        >
          <dl className="detail-list">
            {suitePresetShapes.map((shape) => (
              <div key={shape.presetId}>
                <dt>{shape.preset.clientApp} / {shape.preset.surface}</dt>
                <dd>{shape.result.text}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard
          eyebrow="Suite Profiles"
          title="Preset override editor"
          description="Preview per-app and per-preset profile overrides before promoting them into PROXY_SUITE_PROFILE_PRESETS."
        >
          <div className="detail-list">
            {suitePresetShapes.map((shape) => (
              <div key={`${shape.presetId}-override`}>
                <dt>{shape.presetId}</dt>
                <dd>
                  <label>
                    Profile ID
                    <input
                      value={suiteOverrides[shape.presetId]?.profileId ?? "profile:default"}
                      onChange={(event) =>
                        updateSuiteOverride(shape.presetId, {
                          profileId: event.currentTarget.value,
                          hardConstraintsText: suiteOverrides[shape.presetId]?.hardConstraints?.join("\n") ?? ""
                        })
                      }
                    />
                  </label>
                  <label>
                    Extra constraints
                    <textarea
                      value={suiteOverrides[shape.presetId]?.hardConstraints?.join("\n") ?? ""}
                      onChange={(event) =>
                        updateSuiteOverride(shape.presetId, {
                          profileId: suiteOverrides[shape.presetId]?.profileId ?? "profile:default",
                          hardConstraintsText: event.currentTarget.value
                        })
                      }
                    />
                  </label>
                </dd>
              </div>
            ))}
          </div>
          <p>{profileStoreNotice}</p>
          <button type="button" onClick={() => void copySuiteOverrides()}>
            Copy env JSON
          </button>
          <button type="button" onClick={() => void saveSuiteOverrides()}>
            Save local profile store
          </button>
        </SectionCard>
      </section>
    </div>
  );
}
