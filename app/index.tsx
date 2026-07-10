import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { router } from 'expo-router';
import { driver, summarizeResults, useDriver } from '../lib/driver';
import { makeItems, Row, RowItem } from '../lib/rows';

// "Home" — stands in for the production app's Learn screen: a virtualized
// list (LegendList, JS-level recycling on) whose rows churn plain native
// views through Fabric's recycle pool every time this screen mounts/unmounts
// around navigation.

const ITEMS = makeItems(80, ['#7c5cff', '#ff5c7c', '#5cff9d', '#ffb75c', '#5cc8ff']);

export default function HomeScreen() {
  const d = useDriver();
  return (
    <View style={s.root}>
      <View style={s.panel}>
        <Text style={s.h1}>Touch-dead repro driver</Text>
        <Text style={s.p}>
          Auto-run replays: push course → push video → tap window → dismissTo
          home. During every “TAP NOW” window, tap the blue box repeatedly.
        </Text>
        <View style={s.buttonRow}>
          <Pressable
            style={[s.btn, d.running && s.btnDisabled]}
            onPress={() => driver.start(6)}
            disabled={d.running}
          >
            <Text style={s.btnText}>{d.running ? 'running…' : 'Start auto-run (6 cycles)'}</Text>
          </Pressable>
          <Pressable style={[s.btn, s.btnGhost]} onPress={() => driver.stop()}>
            <Text style={[s.btnText, s.btnGhostText]}>Stop</Text>
          </Pressable>
          <Pressable
            style={[s.btn, s.btnGhost, d.running && s.btnDisabled]}
            onPress={() => router.push('/course')}
            disabled={d.running}
          >
            <Text style={[s.btnText, s.btnGhostText]}>Manual: push course →</Text>
          </Pressable>
        </View>
        <Text style={s.status}>
          {d.running ? `cycle ${d.cycle}/${d.totalCycles} · ${d.phase}` : d.note}
        </Text>
        <Text style={s.results}>{summarizeResults(d)}</Text>
        <Text style={s.hint}>
          ✓n = n taps registered in that cycle&apos;s window · ✗0 = window went
          dead (the bug, if you were tapping)
        </Text>
      </View>
      <LegendList
        data={ITEMS}
        renderItem={({ item }: { item: RowItem }) => (
          <Row item={item} subtitle="home list — churns the recycle pool" />
        )}
        keyExtractor={(item: RowItem) => item.id}
        estimatedItemSize={76}
        recycleItems
        style={s.list}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f4f6' },
  panel: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  h1: { fontSize: 17, fontWeight: '700', color: '#111' },
  p: { fontSize: 13, color: '#555', marginTop: 6, lineHeight: 18 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnGhost: { backgroundColor: '#eef2ff' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnGhostText: { color: '#2563eb' },
  status: { marginTop: 12, fontSize: 13, fontWeight: '600', color: '#111' },
  results: { marginTop: 4, fontSize: 13, color: '#333', fontVariant: ['tabular-nums'] },
  hint: { marginTop: 4, fontSize: 11, color: '#999', lineHeight: 15 },
  list: { flex: 1 },
});
