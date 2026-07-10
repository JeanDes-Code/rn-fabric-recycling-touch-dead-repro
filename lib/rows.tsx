import { StyleSheet, Text, View } from 'react-native';

// A list row made of plain nested Views/Texts — every one of these subviews
// is a candidate for Fabric's per-class component-view recycle pool
// (RCTViewComponentView / RCTParagraphComponentView). The virtualized lists
// mounting and unmounting these rows across navigation are the churn that
// feeds the pool.

export interface RowItem {
  id: string;
  index: number;
  tint: string;
}

export function makeItems(count: number, palette: string[]): RowItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    index: i,
    tint: palette[i % palette.length],
  }));
}

export function Row({ item, subtitle }: { item: RowItem; subtitle: string }) {
  return (
    <View style={s.row}>
      <View style={[s.icon, { backgroundColor: item.tint }]} />
      <View style={s.body}>
        <Text style={s.title}>Item {item.index}</Text>
        <Text style={s.sub}>{subtitle}</Text>
        <View style={s.barTrack}>
          <View style={[s.barFill, { width: `${(item.index * 37) % 100}%` }]} />
        </View>
      </View>
      <View style={s.chevron} />
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  icon: { width: 44, height: 44, borderRadius: 10 },
  body: { flex: 1, marginLeft: 12, marginRight: 8 },
  title: { fontSize: 15, fontWeight: '600', color: '#222' },
  sub: { fontSize: 12, color: '#888', marginTop: 2 },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eee',
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: { height: 4, borderRadius: 2, backgroundColor: '#7c5cff' },
  chevron: {
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#bbb',
    transform: [{ rotate: '45deg' }],
  },
});
