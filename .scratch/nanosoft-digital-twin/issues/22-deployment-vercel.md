# 22 — Deployment — two apps to Vercel Pro (apex + subdomain)

**What to build:** Both apps live on the recorded-default platform — nanisoft.com (apex) + playground.nanisoft.com (subdomain) — wired as two Vercel projects over the pnpm monorepo at Next 16.3.1.

**Blocked by:** 17 (Flagship playbook end-to-end verification), 19 (Landing hero), 20 (Landing architecture section), 21 (Landing narrative sections).

**Status:** ready-for-agent

- [ ] Two Vercel projects (landing, playground) over the pnpm monorepo; both build green via the Vercel Next.js adapter at 16.3.1
- [ ] Apex `nanisoft.com` served via A-record; `playground.nanisoft.com` served via CNAME; both resolve to the deployed apps
- [ ] Deployment open inputs (cost/commercial posture, registrar/DNS host, existing cluster, per-app server-feature needs) gathered/decided before wiring; default = Vercel Pro both apps
- [ ] The 16.3.0 standalone+adapter crash (#96646) is avoided (16.3.1)
- [ ] Both deployed URLs load their respective apps