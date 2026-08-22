# 14 — Atlas + OPA mock

**What to build:** The authz-and-audit mock that teaches the twin is governed — evaluate the OPA decision (ALLOW) and watch Atlas write the audit-log entry.

**Blocked by:** 11 (Tool-overlay framework + DataGerry mock).

**Status:** done — merged to main (`05fc28a`; verified 2026-08-22)

- [x] One overlay, two zones: OPA decision card (input → ALLOW + read-only ~3-line Rego snippet, focal interactive) + Atlas request/response log (`GET use-cases/.../steps → 200`; `POST /authz/check → 200 {allow:true}`; `POST /audit/log → 201`; `GET /traversal/query → 200 [finding]`)
- [x] Canonical action: evaluate the authz decision (user=analyst, use-case=Sensitive Product View Audit → ALLOW) → Atlas writes the audit-log entry
- [x] Atlas writes `audit_log` and reads `SchemaRegistry`; OPA is stateless (reads static policy, writes nothing; the audit write is Atlas's)
- [x] The traversal *result* stays a hand-off to Compass (not Atlas's action) — preserves Compass's climax
- [x] Reuses the overlay chrome + one-code-path pattern from 11