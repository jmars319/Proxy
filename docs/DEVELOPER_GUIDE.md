# Developer Guide

## Bootstrap

1. Run `pnpm bootstrap`.
2. If `check:env` reports missing Rust or macOS build tools, install them before using the desktop app.
3. Copy `.env.example` to `.env` if you need local provider keys or storage overrides.

## Running apps

- Desktop: `pnpm dev:desktop`
- Web: `pnpm dev:web`
- Mobile: `pnpm dev:mobile`
- Desktop + web together: `pnpm dev:both`

## Verifying system health

- Quick checks: `pnpm check:env` and `pnpm check:packages`
- Workspace-wide quality checks: `pnpm lint` and `pnpm typecheck`
- App verification: `pnpm verify:web`, `pnpm verify:desktop`, `pnpm verify:mobile`
- Full pass: `pnpm doctor`

## Adding a new package

1. Create `packages/<name>/src/index.ts`.
2. Add a `package.json` using the `@proxy/<name>` scope.
3. Add a local `tsconfig.json` that extends `../../tsconfig.base.json`.
4. Add a `paths` entry in `tsconfig.base.json` if the package should resolve pre-install in editors and `tsc`.
5. Keep package APIs narrow and move shared logic here before it leaks into app shells.

## Adding a new provider adapter

1. Start in `packages/providers`.
2. Implement the `ProviderAdapter` interface.
3. Keep provider capability concerns separate from policy concerns.
4. Wire runtime config through `packages/config`.
5. Only expose provider results that can still be rewritten and validated locally before display.

## Adding a new profile type

1. Extend profile artifact shapes in `packages/profiles`.
2. Add or update stable domain types in `packages/domain` if the concept is durable.
3. Add runtime parsing in `packages/validation` when the artifact crosses a trust boundary.
4. Avoid app-local parsing logic; apps should consume already-shaped profile objects.

## Keeping apps thin

- UI composition belongs in apps.
- Durable types, business rules, storage interfaces, and provider abstractions belong in packages.
- If a view starts owning validation, routing, or rewrite logic, move it into the appropriate shared package.
