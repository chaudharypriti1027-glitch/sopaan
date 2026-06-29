import { ChevronDown, MapPin, SlidersHorizontal } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import type { CaSortMode } from './caUtils';
import { CA_UI } from './caTheme';

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
        style={({ pressed }) => [styles.filterBtn, pressed && styles.pressed]}
      >
        <MapPin size={11} color={CA_UI.muted} strokeWidth={2.5} />
        <Text style={styles.filterText} numberOfLines={1}>
          {stateLabel}
        </Text>
        <ChevronDown size={11} color={CA_UI.faint} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onMonthPress}
        style={({ pressed }) => [styles.filterBtn, pressed && styles.pressed]}
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
        style={({ pressed }) => [styles.sortBtn, pressed && styles.pressed]}
      >
        <SlidersHorizontal size={11} color={CA_UI.accent} strokeWidth={2.5} />
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
      backgroundColor: CA_UI.surface,
      borderBottomWidth: 1,
      borderBottomColor: CA_UI.border,
    },
    filterBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: CA_UI.borderStrong,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    filterText: {
      flex: 1,
      fontSize: 11,
      fontWeight: '600',
      color: CA_UI.text2,
    },
    sortBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: CA_UI.accentSoft,
      borderWidth: 1,
      borderColor: '#C7D2FE',
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    sortText: {
      fontSize: 10,
      fontWeight: '700',
      color: CA_UI.accent,
    },
    pressed: { opacity: 0.85 },
  });
}
