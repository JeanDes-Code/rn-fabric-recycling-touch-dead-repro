import { useSyncExternalStore } from 'react';

// Touch-probe log. The key discriminator for this bug: when the screen is
// dead, tapping produces NO probe entries at all — not even
// onStartShouldSetResponderCapture on the screen root, which sees every touch
// that reaches React Native's responder system.
//
//   dead taps + silent probe  =  the touch was swallowed by a native view
//                                before it ever reached React Native.
//
// (A JS-side bug — stale state, unmounted handler, gated Pressable — would
// still log the root capture line.)

let lines: string[] = [];
const subscribers = new Set<() => void>();

export function probeLog(line: string) {
  const stamp = new Date().toISOString().slice(11, 23);
  lines = [`${stamp}  ${line}`, ...lines].slice(0, 6);
  console.log(`[probe] ${line}`);
  subscribers.forEach((fn) => fn());
}

export const probe = {
  getLines: (): string[] => lines,
  subscribe(fn: () => void) {
    subscribers.add(fn);
    return () => {
      subscribers.delete(fn);
    };
  },
};

export function useProbeLines(): string[] {
  return useSyncExternalStore(probe.subscribe, probe.getLines);
}
