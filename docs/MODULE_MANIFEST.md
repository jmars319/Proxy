# Module Manifest

Generated from `tenra Registry/contracts/handoff-catalog.json` by `tenra Registry/scripts/generate-suite-contract-docs.mjs`.

## Standalone Mode

Runs as a complete shaping workspace with profiles, presets, constraints, health history, and shaping previews.

## Required Suite Dependencies

- None

## Optional Suite Dependencies

- tenra Assembly: Optional notice shaping source.
- tenra Scout: Optional outreach shaping source.
- tenra Align: Optional review reply shaping source.
- tenra Derive: Optional reasoning brief shaping source.
- Vicina by tenra: Optional workflow shaping source.

## Provides

- external output shaping
- preset shaping
- profile constraints
- suite endpoint health

## Consumes

- shape requests
- preset requests

## Contracts

Emits:

- `tenra-proxy.shape-external-output-request.v1`
- `tenra-proxy.shape-preset-request.v1`

Accepts:

- `tenra-assembly.proxy-notice-handoff.v1`
- `tenra-scout.opportunity-handoff.v1`
- `tenra-proxy.shape-external-output-request.v1`
- `tenra-proxy.shape-preset-request.v1`
- `tenra-align.review-reply-route.v1`
- `tenra-derive.reasoning-brief.v1`
- `tenra-vicina.workflow-handoff.v1`

## Rules

- Each app must remain complete and usable without another tenra app running.
- Suite integrations are optional module links, not required runtime dependencies.
- Shared functions should be exposed through explicit local APIs, exports, imports, or schemas.
- No app may read another app's private filesystem, database, or localStorage state.
- Registry can index and audit the module graph, but it must not become a hidden runtime bus.
