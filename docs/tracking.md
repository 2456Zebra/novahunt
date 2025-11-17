# Event tracking (dev)

This document explains the simple dev event tracking added to the repo.

Endpoints:
- POST /api/track-event
  - Body: { userId?: string|null, eventType: string, payload?: object }
  - Returns { ok: true } on success.

Dev persistence:
- Events are appended to /tmp/novahunt-tracking.jsonl as JSON-lines.
- Users are stored in /tmp/novahunt-users.json for dev convenience.

Production notes:
- Replace /tmp JSON file storage with a real datastore (Postgres, DynamoDB, etc.).
- Ensure PII handling and GDPR/consent requirements are satisfied before retaining emails or other PII.
- Consider adding batching, rate-limiting, and a secure ingestion pipeline.

Security:
- Do not commit secrets.
- Do not log full event payloads in production.