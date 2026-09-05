/**
 * The blog's own entry in the shared cross-site list (@nanisoft/identity
 * crossNavLinks) — a self-link is noise, in the navbar and the footer alike.
 *
 * This lives in a server-safe module on purpose: layout.tsx (server) filters
 * the footer links with it, and a constant imported from a `'use client'`
 * module resolves to a client reference there — the comparison silently
 * never matches (found in the 2026-09-05 brand-layer rebuild).
 */
export const SELF_ORIGIN = 'https://blog.nanisoft.com'
