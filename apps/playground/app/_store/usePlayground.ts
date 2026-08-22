'use client';

import { create } from 'zustand';
import {
  SENSITIVE_PRODUCT_VIEW_AUDIT,
  applyStep,
  blankState,
  exportState as exportPlaygroundState,
  importState as importPlaygroundState,
  InvalidStateError,
  overlayReducer,
  type OverlayState,
  type PlaygroundState,
} from '@nanisoft/architecture';

/** The flagship playbook steps. */
export const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

/** Auto-run pace (SPEC §4.4 — ~1.1s/step, tunable). */
export const STEP_PACE_MS = 1100;

// Module-level interval handle (single-instance playground).
let timer: ReturnType<typeof setInterval> | null = null;
function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

interface PlaygroundStore {
  state: PlaygroundState;
  running: boolean;
  /** The open tool overlay (null = closed). SPEC §4.8. */
  overlay: OverlayState;
  /** Open a full-UI tool overlay for a component id. */
  openTool: (componentId: string) => void;
  /** Close the open tool overlay. */
  closeTool: () => void;
  /** Advance one step; stops at the end. */
  step: () => void;
  /** Begin auto-run. */
  run: () => void;
  /** Pause auto-run. */
  pause: () => void;
  /** Reset to the blank-slate pre-pipeline state. */
  reset: () => void;
  /** Serialize state for export. */
  exportJson: () => string;
  /** Replace state from exported JSON. Returns ok or an error message. */
  importJson: (json: string) => { ok: true } | { ok: false; error: string };
}

export const usePlayground = create<PlaygroundStore>((set, get) => ({
  state: blankState(),
  running: false,
  overlay: null,

  openTool: (componentId) =>
    set((s) => ({
      overlay: overlayReducer(s.overlay, {
        type: 'open',
        componentId,
        cursor: s.state.cursor,
      }),
    })),

  closeTool: () => set((s) => ({ overlay: overlayReducer(s.overlay, { type: 'close' }) })),

  step: () => {
    const { state } = get();
    if (state.cursor >= STEPS.length) {
      clearTimer();
      set({ running: false });
      return;
    }
    const next = applyStep(state, STEPS[state.cursor]);
    set({ state: next });
    if (next.cursor >= STEPS.length) {
      clearTimer();
      set({ running: false });
    }
  },

  run: () => {
    const { state, running } = get();
    if (running) return;
    if (state.cursor >= STEPS.length) return;
    set({ running: true });
    timer = setInterval(() => get().step(), STEP_PACE_MS);
  },

  pause: () => {
    clearTimer();
    set({ running: false });
  },

  reset: () => {
    clearTimer();
    set({ state: blankState(), running: false, overlay: null });
  },

  exportJson: () => exportPlaygroundState(get().state),

  importJson: (json) => {
    try {
      const imported = importPlaygroundState(json);
      clearTimer();
      set({ state: imported, running: false, overlay: null });
      return { ok: true };
    } catch (e) {
      const error = e instanceof InvalidStateError ? e.message : 'invalid state';
      return { ok: false, error };
    }
  },
}));

// Dev-only hook so Playwright can drive the store without the Controls UI
// (used by ticket 10 render verification). Stripped in production builds.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as { __playground?: typeof usePlayground }).__playground = usePlayground;
}