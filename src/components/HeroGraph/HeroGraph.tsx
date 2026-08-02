'use client'

import type { GraphSpec } from './graph-primitives'
import { motion, useReducedMotion } from 'framer-motion'
import { PanelParticles } from '@/components/PanelParticles'
import {
  Edge,
  GraphDefs,
  GraphReveal,
  HighlightedPath,
  Node,
  resolveEdges,
  resolvePath,
} from './graph-primitives'
import { HERO_COPY } from './hero-copy'

// The 9-node system-paths mesh: ingress / identity / network / service / api /
// edge / data / repo / asset. The highlighted route an attacker would take is
// ingress -> identity -> service -> data -> asset. `edge` and `repo` sit off
// the hot path as dimmed mesh nodes, so the graph reads as a whole system, not
// just the one route.
const SPEC: GraphSpec = {
  viewBox: '0 0 360 360',
  nodes: [
    { id: 'edge', x: 150, y: 70, label: 'edge' },
    { id: 'network', x: 70, y: 130, label: 'network' },
    { id: 'identity', x: 150, y: 220, label: 'identity', hot: true },
    { id: 'ingress', x: 60, y: 300, label: 'ingress', hot: true },
    { id: 'api', x: 240, y: 320, label: 'api' },
    { id: 'service', x: 210, y: 170, label: 'service', hot: true },
    { id: 'repo', x: 290, y: 295, label: 'repo' },
    { id: 'data', x: 310, y: 90, label: 'data', hot: true },
    { id: 'asset', x: 330, y: 210, label: 'asset', hot: true },
  ],
  edges: [
    { from: 'edge', to: 'network' },
    { from: 'edge', to: 'identity' },
    { from: 'ingress', to: 'identity', hot: true },
    { from: 'ingress', to: 'network' },
    { from: 'identity', to: 'network' },
    { from: 'identity', to: 'service', hot: true },
    { from: 'network', to: 'service' },
    { from: 'api', to: 'ingress' },
    { from: 'api', to: 'service' },
    { from: 'api', to: 'repo' },
    { from: 'service', to: 'repo' },
    { from: 'service', to: 'data', hot: true },
    { from: 'data', to: 'asset', hot: true },
    { from: 'service', to: 'asset' },
    { from: 'api', to: 'asset' },
  ],
  path: ['ingress', 'identity', 'service', 'data', 'asset'],
}

const RESOLVED_EDGES = resolveEdges(SPEC)
const PATH_NODES = resolvePath(SPEC)

const HEADLINE_GRADIENT = 'bg-linear-to-br from-blue-500 via-purple-500 to-pink-400 bg-clip-text text-transparent'
const CTA_GRADIENT = 'bg-linear-to-r from-blue-500 via-purple-500 to-pink-400'

/**
 * Homepage hero — text-left / graph-right split (stacks single-column on
 * mobile). The headline and the highlighted attack path share the accent
 * gradient. `PanelParticles` sit behind the split, full-bleed; there are no
 * particles elsewhere on the site. Respects reduced motion.
 */
export function HeroGraph() {
  const reduce = useReducedMotion()
  return (
    <div className="relative min-h-[88vh] w-full overflow-hidden">
      <PanelParticles />
      {/* ambient glows, matching the existing hero idiom */}
      <div className="pointer-events-none absolute left-[6%] top-10 size-72 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[8%] top-24 size-80 rounded-full bg-purple-600/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 pt-28 pb-24 lg:grid-cols-2 lg:gap-16 lg:pt-36">
        {/* left: copy */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-start"
        >
          <span className="mb-5 inline-flex items-center rounded-full border border-zinc-700/60 bg-zinc-900/60 px-3 py-1 text-xs font-medium tracking-wide text-zinc-300 backdrop-blur">
            <span className="mr-2 size-1.5 rounded-full bg-pink-400" />
            {HERO_COPY.flagship}
          </span>
          <h1 className={`text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl ${HEADLINE_GRADIENT}`}>
            {HERO_COPY.headline}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
            {HERO_COPY.subtext}
          </p>
          <motion.a
            href="/en/products"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduce ? { duration: 0 } : { delay: 0.4, duration: 0.6 }}
            className={`mt-9 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 ${CTA_GRADIENT}`}
          >
            {HERO_COPY.cta}
            <span className="icon-[mingcute--arrow-right-fill]" />
          </motion.a>
        </motion.div>

        {/* right: graph */}
        <GraphReveal className="relative mx-auto w-full max-w-xl">
          <svg viewBox={SPEC.viewBox} className="w-full" role="img" aria-label="System paths graph with one highlighted route from ingress to asset">
            <GraphDefs idSuffix="hero" />
            {RESOLVED_EDGES.map((edge, i) => (
              <Edge key={`${edge.from.id}-${edge.to.id}`} edge={edge} index={i} />
            ))}
            <HighlightedPath pathNodes={PATH_NODES} idSuffix="hero" />
            {SPEC.nodes.map((n, i) => (
              <Node key={n.id} node={n} idSuffix="hero" index={i} />
            ))}
          </svg>
        </GraphReveal>
      </div>
    </div>
  )
}
