# Suite Handoff Standard

Generated from `tenra Registry/contracts/handoff-catalog.json` by `tenra Registry/scripts/generate-suite-contract-docs.mjs`.

## App Role

shared shaping and tone service

keep unique as a reusable module; many apps should call Proxy rather than duplicating shaping logic.

## Standalone Mode

Runs as a complete shaping workspace with profiles, presets, constraints, health history, and shaping previews.

## Accepted Inputs

- `tenra-assembly.proxy-notice-handoff.v1` from tenra Assembly
- `tenra-scout.opportunity-handoff.v1` from tenra Scout
- `tenra-proxy.shape-external-output-request.v1` from source apps
- `tenra-proxy.shape-preset-request.v1` from source apps
- `tenra-align.review-reply-route.v1` from tenra Align
- `tenra-derive.reasoning-brief.v1` from tenra Derive
- `tenra-vicina.workflow-handoff.v1` from Vicina by tenra

## Emitted Outputs

- `tenra-proxy.shape-external-output-request.v1` to tenra Proxy
- `tenra-proxy.shape-preset-request.v1` to tenra Proxy

## Standard Controls

- correlation id
- preview payload
- retry failed
- history
- preset import/export
- schema badge
- copy payload
- send or export
- destination presets
- route timeline
- conflict history
- brief comparison
- endpoint health
- workflow timeline

## Status Vocabulary

- `draft`: Payload or route exists locally but has not been previewed.
- `previewed`: Payload was built and inspected without delivery.
- `queued`: Delivery is waiting for an endpoint, retry, or operator action.
- `sent`: Producer posted or exported the payload successfully.
- `accepted`: Consumer parsed and retained the payload.
- `rejected`: Consumer refused the payload for schema, routing, safety, or policy reasons.
- `failed`: Delivery failed before acceptance or rejection was known.
- `replayed`: Registry or a producer regenerated a prior payload for another delivery attempt.
- `received`: Consumer acknowledged receipt back to the source app.
- `dismissed`: Operator intentionally removed an item from an inbox, queue, or retry list.

## Local Storage

Prefix: `tenra.proxy`

- `tenra.proxy.shapeHistory.v1`
- `tenra.proxy.endpointHealth.v1`
- `tenra.proxy.presetOverrides.v1`

## Endpoints

- POST `/api/shape-external-output` - Shape external output
- POST `/api/shape-preset` - Shape preset
