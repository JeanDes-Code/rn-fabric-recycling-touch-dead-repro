import { StyleSheet, View } from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { Row, RowItem } from '../../lib/rows';
import { useChurningItems } from '../../lib/churn';

// Second tab — a catalog-like list that stays mounted under the tab bar
// while the navigation cycle runs, adding a second virtualized list to the
// recycle-pool churn (the production app keeps Learn + Catalog mounted).

const PALETTE = ['#e11d48', '#7c3aed', '#059669', '#d97706', '#0284c7'];

export default function BrowseScreen() {
  const items = useChurningItems(70, PALETTE);
  return (
    <View style={s.root}>
      <LegendList
        data={items}
        renderItem={({ item }: { item: RowItem }) => (
          <Row item={item} subtitle="browse tab — parked churn under the tab bar" />
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
  list: { flex: 1 },
});
