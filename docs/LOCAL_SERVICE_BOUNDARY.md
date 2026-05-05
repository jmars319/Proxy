# Local Service Boundary

Proxy should be the local voice and output-shaping service for tenra apps. The apps remain independent, but they can pass drafts through Proxy before text is printed, emailed, published, or handed to another system.

## Contract

The shared TypeScript contract lives in `packages/api-contracts/src/index.ts`.

- `ShapeExternalOutputRequest` names the calling app, output surface, voice profile, purpose, draft text, audience, and hard constraints.
- `ShapeExternalOutputResponse` returns the shaped text, validation report, rewrite trace, escalation decision, and whether a Guardrail review is recommended.

## First Clients

- Registry: customer letters, past-due notices, rental documents, and email subjects.
- Align: public profile descriptions, service descriptions, posts, and response copy.
- Scout: outreach drafts and market summaries.
- Assembly: website copy and reusable content assembled from approved briefs.

## Operating Rule

Proxy should not decide whether an operational action is allowed. It shapes text. If the shaped text will be sent externally, published, or tied to money/customer records, the calling app should pair Proxy with Guardrail before final delivery.
