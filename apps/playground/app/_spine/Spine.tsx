'use client';

import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  SmoothStepEdge,
  useReactFlow,
  type Edge as RFEdge,
  type EdgeTypes,
  type Node as RFNode,
  type NodeMouseHandler,
  type NodeTypes,
} from '@xyflow/react';
import { color, radius } from '@nanisoft/identity';
import { COMPONENT_BY_ID, SENSITIVE_PRODUCT_VIEW_AUDIT, beckonToolId, deriveStatus } from '@nanisoft/architecture';
import { buildSpineGraph, type SpineEdge, type SpineNode } from './spine-graph';
import { NodeChip, CHIP_W, CHIP_H, type NodeStatus } from './NodeChip';
import { PhaseBand, type PhaseStatus } from './PhaseBand';
import { usePlayground } from '../_store/usePlayground';

const nodeTypes: NodeTypes = { chip: NodeChip, phase: PhaseBand };
const edgeTypes: EdgeTypes = { smoothstep: SmoothStepEdge };
const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

// Idle edge strokes go through the mode-aware viz roles (globals.css): the old
// identity constants sat under the 3:1 non-text floor (petrolTint ≈2.0:1 on
// bone light, petrolSoft ≈2.4:1 on petrol dark — WCAG 1.4.11). The arrowhead
// rides along: xyflow applies marker color as an inline STYLE on the marker
// path (not a presentation attribute), so a var() resolves there too and the
// head always matches its stroke in both modes. Jade/teal stay the
// mode-invariant identity accents for the live/done states.
const IDLE_DOTTED_STROKE = 'var(--viz-memberof)'; // dotted platform/observe edges
const IDLE_SOLID_STROKE = 'var(--viz-neutral)';   // solid idle data-flow edges
const JADE = color.jade;                          // active edge
const TEAL = color.teal;                          // done edge

function chipStatus(id: string, active: string | null, done: Set<string>): NodeStatus {
  if (id === active) return 'active';
  if (done.has(id)) return 'done';
  return 'idle';
}

function phaseStatusFor(phaseId: string, activePhase: string | null, cursor: number): PhaseStatus {
  if (phaseId === 'sources') return 'idle';
  if (activePhase === phaseId) return 'active';
  // done when this phase's last step has been applied
  const lastN = Math.max(...STEPS.filter((s) => s.phase === phaseId).map((s) => s.n));
  return cursor >= lastN ? 'done' : 'idle';
}

function toRFNode(
  n: SpineNode,
  active: string | null,
  done: Set<string>,
  activePhase: string | null,
  cursor: number,
  beckonId: string | null,
  openId: string | null,
  onOpenTool: (id: string) => void,
): RFNode {
  if (n.kind === 'chip') {
    return {
      id: n.id,
      type: 'chip',
      position: n.position,
      data: {
        component: n.component,
        status: chipStatus(n.id, active, done),
        beckon: beckonId === n.id,
        open: openId === n.id,
        onOpenTool,
      },
      width: CHIP_W,
      height: CHIP_H,
      draggable: false,
      selectable: false,
      focusable: false,
    };
  }
  const phaseId = n.id.replace('phase-', '');
  return {
    id: n.id,
    type: 'phase',
    position: n.position,
    data: {
      name: n.phase!.name,
      width: n.phase!.width,
      subtle: n.phase!.subtle,
      status: phaseStatusFor(phaseId, activePhase, cursor),
    },
    width: n.phase!.width,
    height: 40,
    draggable: false,
    selectable: false,
    focusable: false,
  };
}

function toRFEdge(e: SpineEdge, activeEdgeId: string | null, doneEdgeIds: Set<string>): RFEdge {
  const isActive = activeEdgeId === e.id;
  const isDone = !isActive && doneEdgeIds.has(e.id);
  let stroke: string = e.dotted ? IDLE_DOTTED_STROKE : IDLE_SOLID_STROKE;
  let strokeWidth = 1.5;
  let dasharray = e.dotted ? '2 5' : undefined;
  let className: string | undefined;
  if (isActive) {
    stroke = JADE;
    strokeWidth = 2.2;
    dasharray = '6 6';
    className = 'spine-edge-active';
  } else if (isDone) {
    stroke = TEAL;
    strokeWidth = 1.8;
  }
  return {
    id: e.id,
    source: e.from,
    target: e.to,
    type: 'smoothstep',
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
    style: { stroke, strokeWidth, strokeDasharray: dasharray },
    className,
    pathOptions: { borderRadius: 12 },
  } as RFEdge;
}

function SpineInner() {
  const { nodes, edges } = useMemo(() => buildSpineGraph(), []);
  const cursor = usePlayground((s) => s.state.cursor);
  const overlay = usePlayground((s) => s.overlay);
  const openTool = usePlayground((s) => s.openTool);
  const closeTool = usePlayground((s) => s.closeTool);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const status = useMemo(() => deriveStatus(STEPS, cursor), [cursor]);
  const beckonId = useMemo(() => beckonToolId(STEPS, cursor), [cursor]);
  const activeEdgeId = status.activeEdge ? `${status.activeEdge.from}__${status.activeEdge.to}` : null;
  const openId = overlay?.componentId ?? null;

  // Re-fit when the pane's camera contract changes. With the overlay open the
  // map loses ~55% of its width, so a whole-map fit re-lands the ~1040px spine
  // at scale ≈0.35–0.45 and the 14px mono codenames read at ~5px. Anchoring on
  // the node WHOSE OVERLAY IS OPEN keeps the inspected neighborhood at a
  // readable zoom; the whole map stays one deliberate zoom-out away (the
  // controls below). rAF lets the new CSS width + React Flow's ResizeObserver
  // settle. Reduced motion lands on the end state with no tween — globals.css
  // suppresses CSS animation, not React Flow's own camera transition.
  const refit = useCallback(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (openId) {
      void fitView({ nodes: [{ id: openId }], padding: 0.3, maxZoom: 0.75, duration: reduce ? 0 : 400 });
    } else {
      void fitView({ padding: 0.2 });
    }
  }, [fitView, openId]);

  useEffect(() => {
    const raf = requestAnimationFrame(refit);
    return () => cancelAnimationFrame(raf);
  }, [refit]);

  // Re-fit when the pane's BOX changes — rotation, crossing the 980px stack,
  // viewport resize. fitView runs on init only; a stale transform after a box
  // change left the band half-width and off-center at the new size.
  const paneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = paneRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(refit);
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [refit]);

  // React Flow disables pointer events on a node wrapper unless the node is
  // selectable/draggable/interactive — this graph sets none of those (the click
  // handling lives inside NodeChip), which left every tool chip unclickable:
  // real pointer events fell through to the pane (caught by e2e spec B).
  // Passing onNodeClick restores wrapper pointer events AND routes node clicks
  // through the store; it duplicates the chip's own onClick harmlessly (same
  // idempotent openTool) and keeps keyboard activation on the chip untouched.
  const onNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      if (node.type !== 'chip') return;
      const component = COMPONENT_BY_ID[node.id];
      if (component?.fullUi) openTool(component.id);
    },
    [openTool],
  );

  // Deliberate zoom, restyled to identity: scroll-zoom stays OFF (a guided
  // tour must not zoom while the reader scrolls past), but a reader who wants
  // the whole map back after a split-pane neighborhood fit needs a control that
  // is not a pinch gesture. Buttons are pill-adjacent inner-12 chips on the
  // elevated surface with a 1px hairline — no library chrome, no shadow (Flat
  // Estate), real <button>s so they are keyboard-focusable and labeled.
  const zoomBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    padding: 0,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-elev)',
    color: 'var(--color-text)',
    borderRadius: radius.inner, /* shape lock: card 20 / inner 12 / pill */
    cursor: 'pointer',
  };

  return (
    <div ref={paneRef} style={{ position: 'relative', height: '100%' }}>
      <ReactFlow
        nodes={nodes.map((n) =>
          toRFNode(n, status.activeNodeId, status.doneNodeIds, status.activePhase, cursor, beckonId, openId, openTool),
        )}
        edges={edges.map((e) => toRFEdge(e, activeEdgeId, status.doneEdgeIds))}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={closeTool}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        elementsSelectable={false}
        // Reachability law: the graph is ~1040px wide, so below ~700px of
        // container width it clips. Scroll-zoom stays OFF (a guided tour must not
        // zoom while the reader scrolls past), but deliberate gestures — drag to
        // pan, pinch to zoom — are ON, and minZoom 0.2 (React Flow's default 0.5
        // clamped harder than a phone needs) lets the whole spine be brought into
        // view at 390px. Chips keep their own clicks; drags start on the pane.
        // (On touch the pane also yields vertical swipes to the page — see the
        // pointer:coarse block in globals.css.)
        panOnDrag
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch
        zoomOnDoubleClick={false}
        minZoom={0.2}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'var(--color-bg)' }}
      />
      {/* Graph-pane corner controls (`.pg-zoom` carries the 44px touch floor). */}
      <div
        style={{
          position: 'absolute',
          right: 10,
          bottom: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          zIndex: 6,
        }}
      >
        <button
          type="button"
          className="pg-zoom"
          style={zoomBtn}
          aria-label="Zoom in"
          onClick={() => void zoomIn()}
        >
          {/* Drawn marks, not unicode glyphs: one stroke weight, round caps. */}
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ display: 'block' }}>
            <path d="M3.5 7h7M7 3.5v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </svg>
        </button>
        <button
          type="button"
          className="pg-zoom"
          style={zoomBtn}
          aria-label="Zoom out"
          onClick={() => void zoomOut()}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ display: 'block' }}>
            <path d="M3.5 7h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function Spine() {
  return (
    <ReactFlowProvider>
      <SpineInner />
    </ReactFlowProvider>
  );
}