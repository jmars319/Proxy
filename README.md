# Proxy by JAMARQ

Proxy is a local-first AI layer that rewrites any upstream model output into the user's voice and enforces user-defined constraints before anything reaches them.

This repository is scaffolded as a `pnpm` monorepo with thin apps and shared packages. Capability can come from any model provider. Voice authority, validation, and policy decisions are designed to stay local-first.

## Why Proxy exists

- Upstream providers are interchangeable capability sources.
- Local profiles define tone, style, boundaries, and rewrite expectations.
- Rewrite and validation pipelines sit between model output and the user-facing surface.
- Local authority is the product, not an optional post-processing step.

## Platform status

- `desktopapp`: primary product surface, built with Tauri + Vite + React.
- `webapp`: secondary shell, built with Vite + React for consistency with the desktop renderer.
- `mobileapp`: Expo scaffold for future activation; intentionally minimal in `v0`.

## Repo structure

```text
apps/
  desktopapp/   Primary UX shell
  webapp/       Secondary product shell
  mobileapp/    Placeholder mobile surface

packages/
  shared-types/ Foundational primitives
  domain/       Stable product concepts
  api-contracts/ Shared request/response contracts
  validation/   Zod schemas and runtime parsing
  auth/         Minimal local user/session placeholders
  privacy/      Redaction and data-boundary helpers
  ui/           Shared tokens and tiny React primitives
  config/       Branding, env parsing, feature flags
  profiles/     Voice-profile artifacts and helpers
  rewrite-engine/ Local rewrite pipeline seed
  policy/       Constraints, guardrails, escalation rules
  providers/    Provider abstractions and mock routing
  storage/      Local-first persistence interfaces
```

## Commands

- `pnpm bootstrap`: checks local prerequisites and installs dependencies.
- `pnpm check:env`: validates Node, pnpm, Rust, Cargo, and macOS toolchain availability.
- `pnpm check:packages`: validates the required workspace apps and package manifests.
- `pnpm dev:desktop`: runs the primary desktop app.
- `pnpm dev:web`: runs the web shell.
- `pnpm dev:mobile`: runs the Expo mobile app.
- `pnpm dev:both`: runs desktop and web dev servers together.
- `pnpm build:web`
- `pnpm build:desktop`
- `pnpm build:mobile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm verify:all`
- `pnpm doctor`

## Workflow notes

- `pnpm-workspace.yaml` uses `nodeLinker: hoisted` to keep Expo and the rest of the workspace predictable in one repo.
- The apps are intentionally thin. Shared behavior belongs in `packages/`.
- Desktop build output is configured without installer bundling for `v0`, so the repo can verify the Tauri app without requiring branded icon assets on day one.

See `docs/REPO_MAP.md`, `docs/DEVELOPER_GUIDE.md`, and `docs/STABILITY_CHECKLIST.md` for implementation details.
