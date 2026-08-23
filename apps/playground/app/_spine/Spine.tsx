'use client';

import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo } from 'react';
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
import { color, surface } from '@nanisoft/identity';
import { COMPONENT_BY_ID, PHASES, SENSITIVE_PRODUCT_VIEW_AUDIT, beckonToolId, deriveStatus } from '@nanisoft/architecture';
import { buildSpineGraph, type SpineEdge, type SpineNode } from './spine-graph';
import { NodeChip, CHIP_W, CHIP_H, type NodeStatus } from './NodeChip';
import { PhaseBand, type PhaseStatus } from './PhaseBand';
import { usePlayground } from '../_store/usePlayground';

const nodeTypes: NodeTypes = { chip: NodeChip, phase: PhaseBand };
const edgeTypes: EdgeTypes = { smoothstep: SmoothStepEdge };
const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

const PETROL_SOFT = color.petrolSoft; // solid idle data-flow edges
const PETROL_TINT = color.petrolTint; // dotted idle platform/observe edges
const JADE = color.jade;              // active edge
const TEAL = color.teal;              // done edge

function orderOf(phaseId: string): number {
  return PHASES.findIndex((p) => p.id === phaseId);
}

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
  let stroke: string = e.dotted ? PETROL_TINT : PETROL_SOFT;
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
  const { fitView } = useReactFlow();

  const status = useMemo(() => deriveStatus(STEPS, cursor), [cursor]);
  const beckonId = useMemo(() => beckonToolId(STEPS, cursor), [cursor]);
  const activeEdgeId = status.activeEdge ? `${status.activeEdge.from}__${status.activeEdge.to}` : null;
  const openId = overlay?.componentId ?? null;

  // Re-fit when the split-pane opens/closes so the slimmed spine keeps the
  // active node in view (rAF lets the new CSS width + React Flow's ResizeObserver settle).
  useEffect(() => {
    const raf = requestAnimationFrame(() => fitView({ padding: 0.2 }));
    return () => cancelAnimationFrame(raf);
  }, [fitView, openId]);

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

  return (
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
      panOnDrag={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      proOptions={{ hideAttribution: true }}
      style={{ background: surface.light.bg }}
    />
  );
}

export default function Spine() {
  return (
    <ReactFlowProvider>
      <SpineInner />
    </ReactFlowProvider>
  );
}