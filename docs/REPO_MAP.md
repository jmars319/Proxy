# Repo Map

## Apps

### `apps/desktopapp`

Primary product surface. This is the most complete shell in the repo and is where Proxy's calm, local-first user experience should lead.

- Status: foundational
- Stack: Tauri + Vite + React + TypeScript
- Role: workspace shell for profiles, providers, policy, diagnostics, and generation flow orchestration

### `apps/webapp`

Secondary surface. It is intentionally lighter than desktop and stays aligned with the same renderer stack to reduce operational complexity.

- Status: foundational, lighter-weight
- Stack: Vite + React + TypeScript
- Role: product shell, future landing/admin/profile surface

### `apps/mobileapp`

Future-facing scaffold. It exists so the monorepo is standardized from day one, not because mobile is a fully active product surface yet.

- Status: placeholder
- Stack: Expo + React Native + TypeScript
- Role: future mobile activation point for profile-aware workflows

## Packages

### Foundational packages

- `packages/shared-types`: boring cross-cutting primitives and `Result<T>` helpers.
- `packages/domain`: stable core models for profiles, generation, rewrite reports, routing, and escalation decisions.
- `packages/api-contracts`: transport-friendly request and response contracts for future app-to-core boundaries.
- `packages/validation`: Zod schemas for profile metadata, provider configuration, draft requests, and validation results.
- `packages/config`: product constants, env parsing, and provider feature-flag placeholders.
- `packages/profiles`: first-class profile artifact shapes and profile file helpers.
- `packages/rewrite-engine`: rewrite pipeline interfaces and deterministic starter passes.
- `packages/policy`: allow/deny rules, output policy results, and escalation policy decisions.
- `packages/providers`: provider abstraction layer with a mock provider and routing placeholder.
- `packages/storage`: local-first storage interfaces for profiles, settings, and generation history.

### Minimal placeholder packages

- `packages/auth`: intentionally sparse user/session placeholders until real identity requirements exist.
- `packages/privacy`: redaction helpers and data-boundary vocabulary, seeded early because local-first trust is central.
- `packages/ui`: shared tokens and a tiny React card primitive, not a full design system.

## Thin-shell rule

Apps should compose package exports rather than absorb domain logic. If a feature starts to carry durable state, rules, routing logic, or persistence concerns, it should move into `packages/`.
