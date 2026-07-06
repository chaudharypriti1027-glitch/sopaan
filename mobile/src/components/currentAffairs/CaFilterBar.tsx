import { ChevronDown, MapPin, SlidersHorizontal } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import type { CaSortMode } from './caUtils';
import { CA_UI, caChip, caPressFeedback } from './caTheme';

type CaFilterBarProps = {
  stateLabel: string;
  monthLabel: string;
  sortMode: CaSortMode;
  onStatePress: () => void;
  onMonthPress: () => void;
  onSortToggle: () => void;
};

export function CaFilterBar({
  stateLabel,
  monthLabel,
  sortMode,
  onStatePress,
  onMonthPress,
  onSortToggle,
}: CaFilterBarProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        onPress={onStatePress}
        style={({ pressed }) => [styles.filterBtn, pressed && caPressFeedback]}
      >
        <MapPin size={12} color={CA_UI.accent} strokeWidth={2.5} />
        <Text style={styles.filterText} numberOfLines={1}>
          {stateLabel}
        </Text>
        <ChevronDown size={11} color={CA_UI.faint} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onMonthPress}
        style={({ pressed }) => [styles.filterBtn, pressed && caPressFeedback]}
      >
        <Text style={styles.filterText} numberOfLines={1}>
          {monthLabel}
        </Text>
        <ChevronDown size={11} color={CA_UI.faint} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          sortMode === 'latest' ? t('currentAffairs.latestFirst') : t('currentAffairs.trendingFirst')
        }
        onPress={onSortToggle}
        style={({ pressed }) => [styles.sortBtn, pressed && caPressFeedback]}
      >
        <SlidersHorizontal size={11} color={CA_UI.goldDeep} strokeWidth={2.5} />
        <Text style={styles.sortText}>
          {sortMode === 'latest' ? t('currentAffairs.latestFirst') : t('currentAffairs.trendingFirst')}
        </Text>
      </Pressable>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: CA_UI.bg,
    },
    filterBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      ...caChip({ paddingVertical: 9, paddingHorizontal: 10 }),
    },
    filterText: {
      flex: 1,
      fontSize: 11,
      fontWeight: '700',
      color: CA_UI.text2,
    },
    sortBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: CA_UI.goldSoft,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: CA_UI.goldBorder,
      paddingVertical: 9,
      paddingHorizontal: 10,
    },
    sortText: {
      fontSize: 10,
      fontWeight: '800',
      color: CA_UI.goldDeep,
    },
  });
}
