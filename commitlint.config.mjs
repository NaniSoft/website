/** @type {import('@commitlint/types').UserConfig} */
export default {
  // Conventional Commits (feat:, fix:, chore:, ...). Enforced via the
  // `.husky/commit-msg` hook so non-conforming messages are rejected locally
  // before they reach CI.
  extends: ['@commitlint/config-conventional'],
}
