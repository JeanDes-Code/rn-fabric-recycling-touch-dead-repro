# React Native (Fabric, iOS): screen goes touch-dead after `dismissTo` → re-push — orphaned recycled view swallows touches before the responder system

Minimal reproduction for a **New Architecture view-recycling corruption** on iOS:
after a react-native-screens multi-screen pop (`router.dismissTo`) followed by
re-pushing the same route, while virtualized lists churn views underneath, the
re-pushed screen (or a large region of it) **stops receiving touches entirely**.

The blocker is a **pooled `RCTViewComponentView` left attached on top of the
re-pushed screen** — empty (its props were reset by `prepareForRecycle`),
out of sync with the ShadowTree, and `userInteractionEnabled` — so it swallows
every touch **before React Native's responder system ever sees it**. JS is
fully healthy the whole time: components mounted, players ready, listeners
attached. Nothing observable from JS is wrong — except that taps arrive nowhere.

Extracted from a production Expo app where this fires deterministically
(fresh process → 1st entry works → exit → **2nd entry dead**), and where
disabling Fabric view recycling app-wide (see [Workaround](#workaround))
eliminates it completely: 3/3 open→exit→re-open cycles pass in one process,
verified on the iOS simulator (iPhone 17 Pro, iOS 26.2).

> **Status — not yet firing in this minimal form.** This harness replicates
> the production versions, navigation shape (nested tabs + multi-screen
> `dismissTo`), virtualized-list churn (live: rotating ids + structural
> variants every 250ms), and instrumentation — and in the author's simulator
> runs (7 hand-driven entries across flat, nested, and live-churn configs,
> HID taps) every entry stayed alive. The production app on the **same
> versions** reproduces deterministically, so one or more load-bearing
> ingredients are still missing from this reduction — see the
> [fidelity ladder](#fidelity-ladder-if-it-doesnt-fire). The instrumentation
> (probe, tally, driver) is verified end-to-end; treat this repo as the
> scaffold the missing trigger gets pinned into.

## Environment

| | |
|---|---|
| react-native | **0.85.3** (New Architecture / Fabric) |
| react-native-screens | **4.25.2** |
| expo / expo-router | 56.0.15 / 56.2.14 |
| @legendapp/list | 3.3.0 (virtualized lists — the churn source) |
| react-native-gesture-handler | 3.0.1 (+ react-native-nitro-modules 0.35.9, its native runtime) |
| expo-video | 56.1.4 (the victim screen's native view; not believed to be load-bearing) |
| iOS | 26.x (simulator + device), Xcode 26.3 |

The relevant RN core code is unchanged on `main` as of July 2026
([`RCTComponentViewRegistry.mm`](https://github.com/react/react-native/blob/main/packages/react-native/React/Fabric/Mounting/RCTComponentViewRegistry.mm)),
so RN 0.86 is expected to behave identically.

## Run it

```bash
npm install
npx expo run:ios   # prebuild + pod install + build; use an iOS simulator or device
```

## Reproduction protocol

The app mirrors the production topology — a root stack holding a tabs
navigator plus content screens pushed above it, so the `dismissTo` unwinds
the pushed screens back INTO the tabs sub-stack (multi-screen removal across
a navigator boundary). All lists churn live (rotating ids + structural
variants every 250ms), so native views flow through the recycle pool during
the transitions, not just at mount/unmount boundaries:

```
Root Stack
├── (tabs)  ── Repro tab (LegendList, 80 rows, live churn) · Browse tab (70 rows, live churn)
├── course  ── LegendList, 60 rows, live churn
└── video   ── VideoView + overlay (the victim)

(tabs) ──push──▶ course ──push──▶ video ──dismissTo──▶ back into (tabs)  [pops BOTH]
```

1. Launch the app **fresh** (kill it first if already running).
2. Tap **Start auto-run (6 cycles)**. The driver replays:
   `push Course → push Video → 3.2s tap window → dismissTo Home → repeat`.
3. During **every** “CYCLE N — TAP THE BOX NOW” window, tap the blue box
   several times.
4. Read the per-cycle tally (shown on both screens): `C1:✓3  C2:✗0  …`
   - **✓n** — the box registered your taps (screen alive).
   - **✗0 while you were tapping** — the screen is touch-dead: **the bug**.

Expected: every cycle registers taps. Actual (production signature): the
first entry works, a subsequent re-entry (typically the 2nd) is dead, and it
can alternate dead/alive across entries.

A manual mode (buttons on each screen) drives the same path by hand —
in the production app the bug fires with human pacing.

If 6 cycles all pass, kill the app and run it again: the production
protocol is **fresh-process**; the first process-lifetime re-entry is the
most reliable trigger. If it still doesn't fire, see
[Fidelity ladder](#fidelity-ladder-if-it-doesnt-fire) below.

## How to read the touch probe (the discriminator)

The Video screen root carries an `onStartShouldSetResponderCapture` probe —
it logs **every touch that reaches React Native's responder system** on that
screen, even touches claimed by children, and the last entries are displayed
on-screen (and in Metro logs as `[probe] …`).

| Symptom | Probe | Meaning |
|---|---|---|
| Taps register | `capture @ video screen root` + `press @ tap target` | Healthy |
| Taps dead | `capture` logs, no `press` | JS-side bug (gated Pressable, stale state) — **not** this bug |
| Taps dead | **complete silence** | Touch swallowed by a native view before RN — **this bug** |

The production app's diagnosis rests on that third row: mounted, `readyToPlay`,
listeners attached — and not even the root capture probe fires.

## Confirming the orphan view (Xcode)

With the app in the broken state, pause into **Debug View Hierarchy** and
inspect the topmost views over the re-pushed screen: there is a plain
`RCTViewComponentView` (no children, default props) sitting above the
screen's content view, not corresponding to anything in the React tree.
Setting `view.hidden = YES` on it (or `userInteractionEnabled = NO`) via the
debugger restores touch — that view is the blocker.

## Workaround

The `workaround` branch of this repo adds a local Expo module with an ObjC
category returning `+shouldBeRecycled = NO` for `RCTViewComponentView`:

```objc
@implementation RCTViewComponentView (DisableRecycling)
+ (BOOL)shouldBeRecycled
{
  return NO;
}
@end
```

`RCTComponentViewFactory` consults `+shouldBeRecycled` per component-view
class (default YES when absent) — the same public mechanism
react-native-screens already uses to opt its own views out of recycling.
The category extends the opt-out to core views app-wide: every view mounts
fresh and deallocates on unmount — no pool, no orphan.

With this branch, the production app that fired deterministically passes
every cycle. Perf note: the pool only saves the `UIView`/`CALayer`
allocation; props application, Yoga layout, and attach cost the same either
way, and JS-level list recycling (LegendList/FlashList) is unaffected.

## Analysis pointers

- The recycle pool lives in
  [`RCTComponentViewRegistry.mm`](https://github.com/react/react-native/blob/main/packages/react-native/React/Fabric/Mounting/RCTComponentViewRegistry.mm).
  Its enqueue path guards against recycling a mounted view only with
  `RCTAssert(componentView.superview == nil, @"Attempt to recycle a mounted view")` —
  compiled out in release, and **not hit in our debug repro runs**, meaning
  the view is detached at enqueue time and the corruption completes later
  (a stale reference re-attached / double-registered around the
  multi-screen removal), rather than a mounted view being pooled directly.
- The crash family "`Attempt to recycle a mounted view`" reported against
  react-native-screens stack transitions looks like the same underlying
  registry corruption observed from the debug side:
  [software-mansion/react-native-screens#3263](https://github.com/software-mansion/react-native-screens/issues/3263)
  (dismissing multiple screens — flagged missing-repro),
  [#3107](https://github.com/software-mansion/react-native-screens/issues/3107),
  [#2978 family](https://github.com/software-mansion/react-native-screens/issues/2978).
- Trigger conditions isolated in the production app by bisecting a JS bundle
  until the repro flipped: the load-bearing chunk was the **virtualization of
  a list** traversed by the navigation flow (more native view churn through
  the pool). The navigation shape (multi-screen `dismissTo` + re-push) and
  the churn are both required; the video view is the victim surface, not the
  cause.

## Fidelity ladder (if it doesn't fire)

This repro is a minimalization of a production app. Already included in the
baseline: exact dependency versions, nested tabs + multi-screen `dismissTo`
across a navigator boundary, live list churn overlapping the transitions,
`recycleItems` LegendLists, VideoView victim screen. Still differing from
production, in rough order of suspicion:

1. **Reanimated 4 + heavier native view variety** (production runs
   react-native-reanimated 4.4.1 with animated components on most screens;
   excluded here for minimalism).
2. **Heavier subtrees / real content** — production rows are hundreds of
   views deep with images resolving asynchronously; these rows are ~10 plain
   views.
3. **Scroll state + scroll during navigation** (deepens and reorders the
   recycle pools).
4. **More screens/lists in the dismissed span** (3+ screens popped at once).
5. **Real device hardware timing** (the production bug was discovered on
   device; the deterministic sim repro used the production app itself).

The subtractive path is guaranteed to converge where the additive one
hasn't yet: the production app reproduces deterministically, so stripping it
down chunk by chunk until the repro stops firing pins the exact load-bearing
ingredient set. That bisect (which already isolated the list-virtualization
chunk as necessary) is how the missing ingredient will be identified and
ported here.

Issues/PRs welcome — the goal of this repo is to give upstream a
deterministic, minimal trigger.
