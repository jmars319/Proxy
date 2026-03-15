# Stability Checklist

Use this checklist before treating the scaffold as a healthy baseline.

- [ ] `pnpm install` completes successfully.
- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm build:web` succeeds.
- [ ] `pnpm build:desktop` succeeds.
- [ ] `pnpm build:mobile` succeeds.
- [ ] Workspace package imports resolve cleanly across apps and packages.
- [ ] `pnpm check:env` passes on the target machine.
- [ ] `pnpm check:packages` passes.
- [ ] `pnpm verify:all` runs cleanly.
- [ ] `pnpm doctor` runs cleanly.

Manual follow-up items for this scaffold:

- Replace temporary desktop bundle settings and add branded icon assets before installer distribution.
- Expand validation and policy packages before enabling real upstream provider writes in production flows.
- Keep mobile intentionally thin until product scope justifies activation.
