# tenra Proxy Handoffs

tenra Proxy stays unique as the local voice and output-shaping service for the suite. Multiple apps need it, so it should not be folded into one host app.

## Consumes

- Draft text from Registry, Align, Scout, Assembly, Vicina, and manual workflows.
- Voice profile artifacts and hard constraints.

## Produces

- `ShapeExternalOutputResponse` with shaped text, validation report, rewrite trace, escalation decision, and `guardrailRecommended`.
- Portable profile exports.

Proxy should not decide whether an action is allowed. If shaped text will be sent, published, attached to money/customer records, or used for moderation, the calling app should pair Proxy with Guardrail.
