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

/** Scoped running-pulse for the live DAG task (decorative only; the jade border
 *  + fill carry the state — suppressed under prefers-reduced-motion by the
 *  global guard in globals.css). Mirrors the spine-ripple keyframe. */
const PULSE = `
@keyframes airflow-running-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(20, 167, 122, 0); }
  50%      { box-shadow: 0 0 0 4px rgba(20, 167, 122, 0.16); }
}
.airflow-task-running { animation: airflow-running-pulse 1.1s cubic-bezier(.32, .72, 0, 1) infinite; }
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
  if (state === 'running') return color.jade;
  if (state === 'success') return color.teal;
  return color.petrolSoft;
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
        background: running ? 'rgba(20, 167, 122, 0.10)' : 'var(--color-bg-elev)',
        borderRadius: radius.inner,
        padding: compact ? '4px 8px' : '6px 10px',
        fontFamily: font.data,
        fontSize: compact ? 10 : 11,
        color: 'var(--color-text)',
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 6 : 8,
        minWidth: compact ? 76 : 96,
        justifyContent: 'center',
      }}
    >
      <span>{task.label}</span>
      {task.state === 'success' && <span style={{ color: color.teal, fontSize: compact ? 9 : undefined }}>✓</span>}
      {running && <span style={{ color: color.jade, fontSize: compact ? 7 : undefined }}>●</span>}
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
  // ingestion fan-in: 3 extracts (each with a ↓) → load_Bronze
  const extracts = dag.tasks.slice(0, 3);
  const load = dag.tasks[3];
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 10 }}>
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
          aria-label="Run ingestion DAG"
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
                color: line.status === 'success' ? color.teal : color.jade,
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