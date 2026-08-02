# 16 — Footer: flagship links + Resources + Company + social

**What to build:** A footer that lets a visitor navigate from the bottom of any page. Flagship product links (Atlas, Bedrock, Keystone, Compass, Sentinel, Meridian) anchor into `/en/products`; a Resources group (Press Kit); a Company group (About, Blog, Changelog); and env-configured social links — any unset social link omitted, never shown broken.

**Blocked by:** 08 — Products vertical (flagship product anchor slugs derive from the products data module).

**Status:** ready-for-agent

- [ ] `CustomFooter` carries the 6 flagship product links → `/en/products#anchor`.
- [ ] Resources group: Press Kit.
- [ ] Company group: About, Blog, Changelog.
- [ ] Env-configured social links (`NEXT_PUBLIC_GITHUB_URL`, `_LINKEDIN_URL`, `_DISCORD_URL`, `_YOUTUBE_URL`); any unset link omitted, not shown broken.
- [ ] `pnpm check` + `pnpm build` green.
