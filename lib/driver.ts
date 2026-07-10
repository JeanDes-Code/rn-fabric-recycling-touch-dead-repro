import { useSyncExternalStore } from 'react';
import { router } from 'expo-router';

// Auto-driver: replays the navigation cycle that triggers the bug in the
// production app this repro was extracted from:
//
//   push /course  ->  push /video  ->  (tap window)  ->  dismissTo /  ->  repeat
//
// The touch check itself must be a real human tap: the bug blocks touches at
// the native layer, BEFORE React Native's responder system, so nothing
// observable from JS can stand in for a finger. The driver only paces the
// navigation and tallies the taps you land during each cycle's tap window.

export type Phase = 'idle' | 'push-course' | 'push-video' | 'tap-window' | 'dismiss';

export interface DriverState {
  running: boolean;
  cycle: number; // 1-based; 0 = not started
  totalCycles: number;
  phase: Phase;
  results: number[]; // taps registered during each cycle's tap window
  note: string;
}

// Generous waits so every screen transition fully settles — the production
// repro fires with human pacing, no need to race the animations.
const TIMINGS = {
  afterPushCourse: 700,
  afterPushVideo: 900,
  tapWindow: 3200,
  afterDismiss: 1400,
} as const;

let state: DriverState = {
  running: false,
  cycle: 0,
  totalCycles: 0,
  phase: 'idle',
  results: [],
  note: 'idle',
};

const subscribers = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

function set(patch: Partial<DriverState>) {
  state = { ...state, ...patch };
  subscribers.forEach((fn) => fn());
}

function schedule(fn: () => void, ms: number) {
  timer = setTimeout(fn, ms);
}

function runCycle(i: number) {
  if (!state.running) return;
  set({ cycle: i, phase: 'push-course', note: `cycle ${i}/${state.totalCycles}` });
  console.log(`[driver] cycle ${i}: push /course`);
  router.push('/course');
  schedule(() => {
    set({ phase: 'push-video' });
    console.log(`[driver] cycle ${i}: push /video`);
    router.push('/video');
    schedule(() => {
      set({ phase: 'tap-window' });
      console.log(`[driver] cycle ${i}: tap window open (${TIMINGS.tapWindow}ms)`);
      schedule(() => {
        // Close the window: record an explicit 0 for a silent cycle.
        const results = [...state.results];
        results[i - 1] = results[i - 1] ?? 0;
        set({ phase: 'dismiss', results });
        console.log(
          `[driver] cycle ${i}: taps=${results[i - 1]} -> dismissTo /  (multi-screen pop)`
        );
        router.dismissTo('/');
        schedule(() => {
          if (i >= state.totalCycles) {
            const dead = state.results.filter((r) => r === 0).length;
            set({
              running: false,
              phase: 'idle',
              note:
                dead > 0
                  ? `done — ${dead} dead tap window(s). If you were tapping, that is the bug.`
                  : 'done — every window registered taps',
            });
          } else {
            runCycle(i + 1);
          }
        }, TIMINGS.afterDismiss);
      }, TIMINGS.tapWindow);
    }, TIMINGS.afterPushVideo);
  }, TIMINGS.afterPushCourse);
}

export const driver = {
  getState: (): DriverState => state,
  subscribe(fn: () => void) {
    subscribers.add(fn);
    return () => {
      subscribers.delete(fn);
    };
  },
  start(totalCycles = 6) {
    if (state.running) return;
    set({
      running: true,
      totalCycles,
      cycle: 0,
      phase: 'idle',
      results: [],
      note: 'starting',
    });
    runCycle(1);
  },
  stop() {
    if (timer) clearTimeout(timer);
    timer = null;
    set({ running: false, phase: 'idle', note: 'stopped' });
  },
  recordTap() {
    if (state.running && state.phase === 'tap-window') {
      const results = [...state.results];
      results[state.cycle - 1] = (results[state.cycle - 1] ?? 0) + 1;
      set({ results });
    }
  },
};

export function useDriver(): DriverState {
  return useSyncExternalStore(driver.subscribe, driver.getState);
}

export function summarizeResults(s: DriverState): string {
  if (s.results.length === 0) return 'no cycles completed yet';
  return s.results
    .map((r, i) => `C${i + 1}:${r === 0 ? '✗0' : `✓${r}`}`)
    .join('  ');
}
