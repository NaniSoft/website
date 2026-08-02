'use client'

// Low-level SVG atoms for the homepage hero graph. The hero composes these
// into a text-left / graph-right split: a 9-node system-paths mesh with one
// highlighted route (ingress -> identity -> service -> data -> asset) drawn
// in via `pathLength`. The accent gradient (blue -> purple -> pink) is shared
// with the headline so the graph and the words read as one idea.

import type { Variants } from 'framer-motion'
import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'

// The accent gradient the platform brief calls for: blue -> purple -> pink.
// Used by the highlighted path AND the headline text.
const ACCENT_STOPS = [
  { offset: '0%', color: '#3b82f6' }, // blue-500
  { offset: '50%', color: '#a855f7' }, // purple-500
  { offset: '100%', color: '#f472b6' }, // pink-400
] as const

export interface GraphNode {
  id: string
  x: number
  y: number
  label?: string
  /** Is this node on the highlighted path? */
  hot?: boolean
}

export interface GraphEdge {
  from: string
  to: string
  /** Is this edge part of the highlighted path? */
  hot?: boolean
}

export interface GraphSpec {
  nodes: GraphNode[]
  edges: GraphEdge[]
  /** Ordered node ids forming the highlighted path. */
  path: string[]
  viewBox: string
}

/** An edge with its endpoints resolved to coordinates. */
export interface ResolvedEdge {
  from: GraphNode
  to: GraphNode
  hot?: boolean
}

/** Shared `<defs>` with the accent gradient + a soft glow filter. */
export function GraphDefs({ idSuffix }: { idSuffix: string }) {
  const gradId = `accent-${idSuffix}`
  const glowId = `glow-${idSuffix}`
  return (
    <defs>
      <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
        {ACCENT_STOPS.map(stop => (
          <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
        ))}
      </linearGradient>
      <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="3.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

export function accentHref(idSuffix: string) {
  return `url(#accent-${idSuffix})`
}

/** A single node: a dot, larger + glowing if it is on the highlighted path. */
export function Node({
  node,
  idSuffix,
  index,
}: {
  node: GraphNode
  idSuffix: string
  index: number
}) {
  const reduce = useReducedMotion()
  const r = node.hot ? 7 : 4.5
  return (
    <motion.g
      initial={reduce ? false : { opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduce ? { duration: 0 } : { delay: 0.5 + index * 0.08, type: 'spring', stiffness: 260, damping: 18 }}
    >
      {node.hot && (
        <circle cx={node.x} cy={node.y} r={r + 5} fill={accentHref(idSuffix)} opacity={0.18} />
      )}
      <circle
        cx={node.x}
        cy={node.y}
        r={r}
        fill={node.hot ? accentHref(idSuffix) : 'currentColor'}
        className={node.hot ? '' : 'text-zinc-500 dark:text-zinc-400'}
        stroke={node.hot ? accentHref(idSuffix) : 'currentColor'}
        strokeWidth={node.hot ? 1.5 : 1}
        opacity={node.hot ? 1 : 0.55}
        filter={node.hot ? `url(#glow-${idSuffix})` : undefined}
      />
      {node.label && (
        <text
          x={node.x}
          y={node.y - r - 6}
          textAnchor="middle"
          className="fill-zinc-500 dark:fill-zinc-400"
          style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.04em' }}
        >
          {node.label}
        </text>
      )}
    </motion.g>
  )
}

/** A flat (non-highlighted) edge — thin, low-contrast, currentColor. */
export function Edge({
  edge,
  index,
}: {
  edge: ResolvedEdge
  index: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.line
      x1={edge.from.x}
      y1={edge.from.y}
      x2={edge.to.x}
      y2={edge.to.y}
      stroke="currentColor"
      className="text-zinc-500 dark:text-zinc-500"
      strokeWidth={1}
      strokeOpacity={0.28}
      initial={reduce ? false : { pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={reduce ? { duration: 0 } : { delay: 0.2 + index * 0.05, duration: 0.5 }}
    />
  )
}

/**
 * The highlighted path: a single polyline drawn through the path nodes,
 * animated drawing-in via `pathLength`, then held with a soft glow.
 */
export function HighlightedPath({
  pathNodes,
  idSuffix,
}: {
  pathNodes: GraphNode[]
  idSuffix: string
}) {
  const d = useMemo(() => {
    if (pathNodes.length === 0) {
      return ''
    }
    const [first, ...rest] = pathNodes
    let s = `M ${first.x} ${first.y}`
    for (const node of rest) {
      s += ` L ${node.x} ${node.y}`
    }
    return s
  }, [pathNodes])

  const reduce = useReducedMotion()
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={accentHref(idSuffix)}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      filter={`url(#glow-${idSuffix})`}
      initial={reduce ? false : { pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={reduce ? { duration: 0 } : { delay: 0.9, duration: 1.4, ease: 'easeInOut' }}
    />
  )
}

const nodeVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: { opacity: 1, y: 0 },
}

/** Fade-up reveal wrapper for the graph container. */
export function GraphReveal({
  children,
  className,
  delay = 0.15,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : 'hidden'}
      animate="shown"
      className={className}
      variants={nodeVariants}
      transition={reduce ? { duration: 0 } : { duration: 0.9, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

/** Resolve a spec's path ids into ordered node objects (drops unknown ids). */
export function resolvePath(spec: GraphSpec): GraphNode[] {
  const byId = new Map(spec.nodes.map(n => [n.id, n]))
  return spec.path
    .map(id => byId.get(id))
    .filter((n): n is GraphNode => Boolean(n))
}

/**
 * Resolve a spec's edges to coordinates. Throws if an endpoint is missing —
 *  the spec is static, so a bad edge is a programming error, not a runtime case.
 */
export function resolveEdges(spec: GraphSpec): ResolvedEdge[] {
  const byId = new Map(spec.nodes.map(n => [n.id, n]))
  return spec.edges.map((e) => {
    const from = byId.get(e.from)
    const to = byId.get(e.to)
    if (!from || !to) {
      throw new Error(`Bad graph edge: ${e.from} -> ${e.to}`)
    }
    return { from, to, hot: e.hot }
  })
}
