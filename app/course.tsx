import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { router } from 'expo-router';
import { makeItems, Row, RowItem } from '../lib/rows';

// Mid screen — stands in for the production app's course/quest list: a second
// virtualized list between home and the victim screen, so the
// dismissTo-from-video pops TWO screens at once (the multi-screen removal is
// part of the trigger).

const ITEMS = makeItems(60, ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444']);

export default function CourseScreen() {
  return (
    <View style={s.root}>
      <View style={s.panel}>
        <Pressable style={s.btn} onPress={() => router.push('/video')}>
          <Text style={s.btnText}>Manual: push video →</Text>
        </Pressable>
      </View>
      <LegendList
        data={ITEMS}
        renderItem={({ item }: { item: RowItem }) => (
          <Row item={item} subtitle="course list — more pool churn" />
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
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  btn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  list: { flex: 1 },
});
