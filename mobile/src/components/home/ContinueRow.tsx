import { useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeSlotIcon } from './HomePremiumIcon';
import { HomeFeedCard } from './HomeFeedCard';
import { HomePlayChip } from './HomePlayChip';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { ContinueItem } from '../../types/home';
import { continueAccentTone, continueItemIcon } from './homeIcons';
import { CONTINUE_CARD_WIDTH } from './homeUtils';
import { HOME_UI } from './homeTheme';

type ContinueRowProps = {
  items: ContinueItem[];
  onItemPress?: (deeplink: string) => void;
};

function progressGradient(accent: ContinueItem['accent']): [string, string] {
  if (accent === 'teal') return [HOME_UI.sage, HOME_UI.sageDeep];
  if (accent === 'gold') return [HOME_UI.goldLt, HOME_UI.gold];
  if (accent === 'coral') return ['#D4A08C', '#A8503E'];
  return [...HOME_UI.accentGradient];
}

function ContinueProgressBar({
  value,
  accent,
}: {
  value: number;
  accent: ContinueItem['accent'];
}) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        track: {
          flex: 1,
          height: 6,
          borderRadius: 99,
          backgroundColor: HOME_UI.borderSoft,
          overflow: 'hidden',
        },
        fill: {
          height: '100%',
          borderRadius: 99,
        },
        pct: {
          fontSize: 11,
          fontFamily: theme.typography.fonts.ui.bold,
          fontWeight: '800',
          color: HOME_UI.muted,
          minWidth: 32,
          textAlign: 'right',
        },
      }),
    [theme],
  );
  const clamped = Math.min(Math.max(value, 0), 100);
  const fillWidth = `${clamped}%` as `${number}%`;

  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <LinearGradient
          colors={progressGradient(accent)}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width: fillWidth }]}
        />
      </View>
      <NumText style={styles.pct}>{clamped}%</NumText>
    </View>
  );
}

export function ContinueRow({ items, onItemPress }: ContinueRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const renderItem = useCallback<ListRenderItem<ContinueItem>>(
    ({ item }) => {
      const Icon = continueItemIcon(item.kind);
      const iconTone = continueAccentTone(item.accent);

      return (
        <HomeFeedCard
          onPress={() => onItemPress?.(item.deeplink)}
          style={styles.cardWrap}
          contentStyle={styles.cardBody}
        >
          <View style={styles.top}>
            <HomeSlotIcon slot="shortcut" Icon={Icon} tone={iconTone} />
            <View style={styles.copy}>
              <Text style={styles.kind} numberOfLines={1}>
                {item.subtitle}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            <HomePlayChip onPress={() => onItemPress?.(item.deeplink)} />
          </View>
          <ContinueProgressBar value={item.progressPct} accent={item.accent} />
        </HomeFeedCard>
      );
    },
    [onItemPress, styles],
  );

  if (!items.length) {
    return null;
  }

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      style={styles.list}
      nestedScrollEnabled
    />
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    list: {
      marginHorizontal: -HOME_UI.sectionPanelPad,
    },
    listContent: {
      gap: 12,
      paddingHorizontal: HOME_UI.sectionPanelPad,
    },
    cardWrap: {
      width: CONTINUE_CARD_WIDTH,
    },
    cardBody: {
      padding: 15,
      gap: 12,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    kind: {
      fontSize: 9.5,
      lineHeight: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: HOME_UI.goldDeep,
    },
    title: {
      fontSize: 14.5,
      lineHeight: 18,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: HOME_UI.ink,
      letterSpacing: -0.2,
    },
  });
}
