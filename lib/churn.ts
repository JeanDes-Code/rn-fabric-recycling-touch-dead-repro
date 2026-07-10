import { useEffect, useMemo, useState } from 'react';
import { makeItems, RowItem } from './rows';

// Live churn: every 250ms a rotating window of rows gets (a) new ids — new
// keys, so cells remount — and (b) a flipped `variant`, which mounts/unmounts
// conditional subviews inside surviving cells. Together they keep plain
// native views flowing through Fabric's recycle pool CONTINUOUSLY, including
// during the push/dismissTo transitions — matching the production app, where
// lists are never static (progress updates, images resolving, state changes).

const WINDOW = 8;
const TICK_MS = 250;

export function useChurningItems(count: number, palette: string[]): RowItem[] {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const items = makeItems(count, palette);
    const start = (tick * WINDOW) % count;
    for (let k = 0; k < WINDOW; k++) {
      const i = (start + k) % count;
      items[i] = {
        ...items[i],
        id: `${items[i].id}-t${tick}`,
        variant: tick % 2 === 0,
      };
    }
    return items;
    // palette is a module-level constant in every caller — safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, count]);
}
