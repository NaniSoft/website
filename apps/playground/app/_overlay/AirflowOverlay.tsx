'use client';

import type { CSSProperties } from 'react';
import { color, font, radius } from '@nanisoft/identity';
import { airflowDagStatus, type AirflowDag, type AirflowTask } from '@nanisoft/architecture';
import { usePlayground } from '../_store/usePlayground';

/**
 * Airflow / Trailhead mock — the "ingest" write surface (SPEC §4.8/§4.9).
 * Structured-echo of Airflow's info shape (a DAG of task boxes with per-task
 * run-state + a trigger + a run log) in nanisoft tokens. The "Run this DAG"
 * button calls store.step() — the same applyStep auto-run uses (one code path).
 * Reads airflowDagStatus(state, cursor) for all task states, the run log, and
 * the trigger flags. Running = jade (live); success = teal (done); pending =
 * petrol. The global prefers-reduced-motion guard suppresses the running pulse;
 * the running state stays readable from the jade border + fill.
 */

/** Scoped running-pulse for the live DAG task. A ::after ring that scales and
 *  fades — transform + opacity only (composited), replacing the old animated
 *  box-shadow that repainted every frame. Suppressed under
 *  prefers-reduced-motion by the global guard in globals.css. */
const PULSE = `
.airflow-task-running { position: relative; }
.airflow-task-running::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  border: 2px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
  pointer-events: none;
  animation: airflow-running-pulse 1.1s cubic-bezier(.32, .72, 0, 1) infinite;
}
@keyframes airflow-running-pulse {
  0%   { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.12); opacity: 0; }
}
`;

const label: CSSProperties = {
  margin: 0,
  fontFamily: font.data,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
};

function borderFor(state: AirflowTask['state']): string {
  // Running stays the identity jade (matching the fill); success is the
  // mode-aware viz teal — raw teal sank to 2.81:1 on petrolMid in dark.
  if (state === 'running') return color.jade;
  if (state === 'success') return 'var(--viz-secondary)';
  return 'var(--color-text-muted)';
}

function TaskBox({ task, compact }: { task: AirflowTask; compact?: boolean }) {
  const running = task.state === 'running';
  return (
    <div
      className={running ? 'airflow-task-running' : undefined}
      role="img"
      aria-label={`${task.label} ${task.state}`}
      style={{
        border: `1px solid ${borderFor(task.state)}`,
        // The running task is the live node: jade FILL + petrol text
        // (role.onAccent, ~4.9:1) — the sanctioned accent pairing, replacing
        // the old 1px jade border (2.87:1) + raw rgba wash.
        background: running ? color.jade : 'var(--color-bg-elev)',
        color: running ? 'var(--color-on-accent)' : 'var(--color-text)',
        borderRadius: radius.inner,
        padding: compact ? '4px 8px' : '6px 10px',
        fontFamily: font.data,
        fontSize: compact ? 10 : 11,
        fontWeight: running ? 700 : 400,
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 6 : 8,
        minWidth: compact ? 76 : 96,
        justifyContent: 'center',
      }}
    >
      <span>{task.label}</span>
      {/* State marks are non-text dots (the DataGerry/Superset legend pattern):
          ✓/● GLYPH text sat at 2.8–3.7:1 (WCAG 1.4.3 fail) — and the old running
          ● was jade ON the jade fill, i.e. invisible. Done = --viz-secondary dot
          (mode-aware teal, ≥3:1 on elev); running = an onAccent dot (petrol on
          jade, the sanctioned pairing). State itself is carried by the fill +
          the role="img" label above. */}
      {task.state === 'success' && (
        <span
          aria-hidden="true"
          style={{ width: compact ? 6 : 7, height: compact ? 6 : 7, borderRadius: 9999, background: 'var(--viz-secondary)', flexShrink: 0 }}
        />
      )}
      {running && (
        <span
          aria-hidden="true"
          style={{ width: compact ? 6 : 7, height: compact ? 6 : 7, borderRadius: 9999, background: 'var(--color-on-accent)', flexShrink: 0 }}
        />
      )}
    </div>
  );
}

function MiniDag({ dag, ariaLabel }: { dag: AirflowDag; ariaLabel: string }) {
  if (dag.id === 'transform') {
    // linear: Forge → Silver → Gold
    return (
      <div role="group" aria-label={ariaLabel} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {dag.tasks.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TaskBox task={t} compact />
            {i < dag.tasks.length - 1 && <span style={{ color: 'var(--color-text-muted)' }}>→</span>}
          </div>
        ))}
      </div>
    );
  }
  // ingestion fan-in: 3 extracts (each with a ↓) → load_Bronze. The extract row
  // wraps (centered): at split-pane widths three boxes + gaps overflowed the
  // pane and CLIPPED at both edges — chips fused with the pane boundary instead
  // of reading as separate map objects.
  const extracts = dag.tasks.slice(0, 3);
  const load = dag.tasks[3];
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, rowGap: 8, maxWidth: '100%' }}>
        {extracts.map((t) => (
          <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <TaskBox task={t} />
            <span style={{ color: 'var(--color-text-muted)', fontFamily: font.data, fontSize: 12 }}>↓</span>
          </div>
        ))}
      </div>
      <TaskBox task={load} />
    </div>
  );
}

export function AirflowOverlay() {
  const state = usePlayground((s) => s.state);
  const step = usePlayground((s) => s.step);
  const dag = airflowDagStatus(state, state.cursor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14 }}>
      <style>{PULSE}</style>

      {/* Ingestion DAG + trigger */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={label}>Ingestion DAG · extract → load_Bronze</p>
        <MiniDag dag={dag.ingestion} ariaLabel="ingestion DAG" />
        <button
          onClick={step}
          disabled={!dag.canTrigger}
          style={{
            alignSelf: 'flex-start',
            fontFamily: font.voice,
            fontSize: 13,
            fontWeight: 600,
            padding: '9px 18px',
            borderRadius: 9999,
            cursor: dag.canTrigger ? 'pointer' : 'not-allowed',
            border: `1px solid ${dag.canTrigger ? color.jade : 'var(--color-border)'}`,
            background: dag.canTrigger ? color.jade : 'transparent',
            color: dag.canTrigger ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
          }}
        >
          {dag.triggered ? 'DAG already run' : 'Run this DAG'}
        </button>
      </div>

      {/* Run log — one line per DAG run */}
      <div
        role="log"
        aria-label="airflow run log"
        style={{
          background: 'var(--color-bg-sunken)',
          borderRadius: radius.inner,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {dag.runLog.length === 0 ? (
          <span style={{ fontFamily: font.data, fontSize: 11, color: 'var(--color-text-muted)' }}>no DAG runs yet</span>
        ) : (
          dag.runLog.map((line) => (
            <div
              key={line.dagId}
              style={{
                fontFamily: font.data,
                fontSize: 11,
                // Log lines are prose: success is muted, anything else is bold
                // ink — teal/jade text sat at 2.4–3.7:1 (WCAG 1.4.3 fail).
                color: 'var(--color-text-muted)',
                fontWeight: line.status === 'success' ? 400 : 700,
              }}
            >
              {line.text}
            </div>
          ))
        )}
      </div>

      {/* Transform DAG — passive, orchestrated (no trigger) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={label}>Transform DAG · orchestrated (passive)</p>
        <MiniDag dag={dag.transform} ariaLabel="transform DAG" />
        <p style={{ ...label, textTransform: 'none', letterSpacing: '0.04em' }}>
          passive · orchestrates phase 3 (Forge → Silver → Gold)
        </p>
      </div>

      <p style={{ ...label, marginTop: 2 }}>
        mocked · orchestration surface only · scheduler/variables/connections/retries/SLA/Gantt hidden
      </p>
    </div>
  );
}