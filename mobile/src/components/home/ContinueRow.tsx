import { useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import { HomeFeedCard } from './HomeFeedCard';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { ContinueItem } from '../../types/home';
import { CONTINUE_CARD_WIDTH } from './homeUtils';
import { HOME_UI } from './homeTheme';

type ContinueRowProps = {
  items: ContinueItem[];
  onItemPress?: (deeplink: string) => void;
};

const RING = 54;
const STROKE = 3.5;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function ContinueRing({ progress }: { progress: number }) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  const offset = CIRC - (clamped / 100) * CIRC;

  return (
    <View style={ringStyles.wrap}>
      <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={R}
          stroke="#EFE9DA"
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={R}
          stroke={HOME_UI.gold}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
      <LinearGradient
        colors={[...HOME_UI.accentGradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={ringStyles.play}
      >
        <Play size={14} color={HOME_UI.goldLt} fill={HOME_UI.goldLt} style={{ marginLeft: 2 }} />
      </LinearGradient>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: {
    width: RING,
    height: RING,
    position: 'relative',
    flexShrink: 0,
  },
  play: {
    position: 'absolute',
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function ContinueCard({
  item,
  fullWidth,
  onPress,
}: {
  item: ContinueItem;
  fullWidth: boolean;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const clamped = Math.min(Math.max(item.progressPct, 0), 100);
  const fillWidth = `${clamped}%` as `${number}%`;

  return (
    <HomeFeedCard
      onPress={onPress}
      accentTop
      style={[styles.cardWrap, fullWidth && styles.cardFull]}
      contentStyle={styles.cardBody}
    >
      <View style={styles.row}>
        <ContinueRing progress={clamped} />
        <View style={styles.copy}>
          <Text style={styles.kind} numberOfLines={1} ellipsizeMode="tail">
            {item.subtitle}
          </Text>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {item.title}
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: fillWidth }]} />
            </View>
            <NumText style={styles.pct}>{clamped}%</NumText>
          </View>
        </View>
      </View>
    </HomeFeedCard>
  );
}

export function ContinueRow({ items, onItemPress }: ContinueRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const single = items.length === 1;

  const renderItem = useCallback<ListRenderItem<ContinueItem>>(
    ({ item }) => (
      <ContinueCard
        item={item}
        fullWidth={false}
        onPress={() => onItemPress?.(item.deeplink)}
      />
    ),
    [onItemPress],
  );

  if (!items.length) {
    return null;
  }

  if (single) {
    return (
      <ContinueCard
        item={items[0]}
        fullWidth
        onPress={() => onItemPress?.(items[0].deeplink)}
      />
    );
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
      marginHorizontal: -HOME_UI.horizontalPad,
    },
    listContent: {
      gap: 12,
      paddingHorizontal: HOME_UI.horizontalPad,
    },
    cardWrap: {
      width: CONTINUE_CARD_WIDTH,
      borderRadius: 22,
    },
    cardFull: {
      width: '100%',
    },
    cardBody: {
      padding: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    kind: {
      fontSize: 9.5,
      lineHeight: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: HOME_UI.goldDeep,
    },
    title: {
      fontSize: 16,
      lineHeight: 20,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: HOME_UI.ink,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 9,
    },
    track: {
      flex: 1,
      height: 6,
      borderRadius: 99,
      backgroundColor: '#F0EBDC',
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 99,
      backgroundColor: HOME_UI.accent,
    },
    pct: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: HOME_UI.goldDeep,
      minWidth: 34,
      textAlign: 'right',
    },
  });
}
