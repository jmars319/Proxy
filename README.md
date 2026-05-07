# tenra Proxy

tenra Proxy is a local-first AI output mediation layer. It rewrites upstream model output into a user-defined voice, applies policy constraints, and keeps final authority with the local profile and operator instead of the model provider.

Capability can come from local rules, local models, or cloud providers. The product boundary is the controlled rewrite and validation layer between raw model output and user-facing text.

## Operational Purpose

- Route model output through a local profile before it reaches the user.
- Preserve tone, style, boundaries, and rewrite expectations as explicit configuration.
- Keep provider capability interchangeable.
- Validate generated material against local policy and escalation rules.

## Design Posture

- Local authority over provider authority.
- Deterministic local provider available by default.
- Optional Ollama and cloud provider paths behind provider boundaries.
- Profiles, rewrite logic, policy, storage, and UI separated into shared packages.
- Desktop-first workflow for local control and review.

## Architecture

```text
apps/
  desktopapp/   Primary Tauri + React/Vite product surface
  webapp/       Secondary Vite shell
  mobileapp/    Expo scaffold for later activation

packages/
  profiles/       Voice-profile artifacts and helpers
  rewrite-engine/ Local rewrite pipeline
  policy/         Constraints, validation, and escalation rules
  providers/      Local, Ollama, and provider routing abstractions
  storage/        Local-first persistence interfaces
  domain/         Stable product concepts
  validation/     Runtime schemas
  privacy/        Data-boundary helpers
  ui/             Shared presentation primitives
```

## Current State

- The desktop app is the active product surface.
- The default workflow works without a cloud key through a deterministic local provider.
- Ollama can be configured for local model assistance.
- Cloud provider keys remain optional capability sources.
- Web and mobile surfaces exist but are secondary or scaffolded.

## Deployment Posture

Proxy is currently a local desktop product scaffold. It should not be treated as a hosted proxy service until provider routing, secrets handling, policy enforcement, and persistence are hardened for that use case.

## Working Locally

```bash
pnpm run bootstrap
pnpm run dev:desktop
pnpm run dev:web
pnpm run typecheck
pnpm run verify:all
pnpm run doctor
```

For local LLM assistance, run Ollama and configure the `VITE_PROXY_OLLAMA_*` environment values.

## Direction

- Strengthen profile portability and review history.
- Expand policy validation without hiding the operator decision path.
- Keep provider integrations replaceable and optional.
- Make local-first behavior the default, not a fallback.

## Related Documentation

- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Local Service Boundary](docs/LOCAL_SERVICE_BOUNDARY.md)
- [Repo Map](docs/REPO_MAP.md)
- [Stability Checklist](docs/STABILITY_CHECKLIST.md)
