import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { router } from 'expo-router';
import { driver, summarizeResults, useDriver } from '../lib/driver';
import { probeLog, useProbeLines } from '../lib/probe';

// The victim screen — stands in for the production app's video step: a
// native VideoView with a custom controls overlay built from plain RN views.
// On the broken re-entry, the whole overlay (and the video area under it)
// stops receiving touches: taps increment nothing, and the pre-responder
// capture probe on the screen root logs nothing. Only a native layer sitting
// on top of the screen can produce that combination.

const VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function VideoScreen() {
  const player = useVideoPlayer(VIDEO_URL, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const [taps, setTaps] = useState(0);
  const [flash, setFlash] = useState(false);
  const d = useDriver();
  const probeLines = useProbeLines();

  return (
    <View
      style={s.root}
      onStartShouldSetResponderCapture={() => {
        // Sees EVERY touch that reaches RN's responder system on this screen,
        // even ones claimed by children. Silence here while tapping = the
        // touch never reached React Native at all.
        probeLog('capture @ video screen root');
        return false;
      }}
    >
      <VideoView player={player} style={s.video} contentFit="cover" nativeControls={false} />

      {/* Custom controls overlay, like the production app's video UI. */}
      <View style={s.overlay}>
        <View style={s.banner}>
          <Text style={s.bannerTitle}>
            {d.running
              ? d.phase === 'tap-window'
                ? `CYCLE ${d.cycle} — TAP THE BOX NOW`
                : `cycle ${d.cycle}/${d.totalCycles} · ${d.phase}`
              : 'manual mode'}
          </Text>
          <Text style={s.bannerSub}>{summarizeResults(d)}</Text>
        </View>

        <Pressable
          style={[s.target, flash && s.targetHit]}
          onPressIn={() => {
            setTaps((t) => t + 1);
            driver.recordTap();
            probeLog('press @ tap target');
            setFlash(true);
            setTimeout(() => setFlash(false), 120);
          }}
        >
          <Text style={s.targetText}>TAP TEST</Text>
          <Text style={s.targetCount}>{taps}</Text>
          <Text style={s.targetHint}>alive = count increments + green flash</Text>
        </Pressable>

        <View style={s.probeBox}>
          <Text style={s.probeTitle}>touch probe — screen root, pre-responder capture</Text>
          {probeLines.length === 0 ? (
            <Text style={s.probeLine}>— no touches seen yet —</Text>
          ) : (
            probeLines.map((line, i) => (
              <Text key={i} style={s.probeLine}>
                {line}
              </Text>
            ))
          )}
          <Text style={s.probeHint}>
            taps do nothing AND nothing new logs here → the touch was swallowed
            natively before reaching React Native (the bug)
          </Text>
        </View>

        <Pressable
          style={s.exit}
          onPress={() => {
            probeLog('press @ exit');
            router.dismissTo('/');
          }}
        >
          <Text style={s.exitText}>EXIT — dismissTo home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  video: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 64,
    paddingBottom: 40,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  banner: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    padding: 12,
  },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bannerSub: {
    color: '#ddd',
    fontSize: 13,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  target: {
    alignSelf: 'center',
    width: 220,
    height: 150,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetHit: { backgroundColor: '#16a34a' },
  targetText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  targetCount: { color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 2 },
  targetHint: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4 },
  probeBox: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    padding: 10,
  },
  probeTitle: { color: '#9ae6b4', fontSize: 11, fontWeight: '700' },
  probeLine: {
    color: '#eee',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  probeHint: { color: '#f6ad55', fontSize: 10, marginTop: 6, lineHeight: 14 },
  exit: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exitText: { color: '#111', fontWeight: '700', fontSize: 14 },
});
