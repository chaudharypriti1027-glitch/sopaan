import { useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, BookOpen, Video } from 'lucide-react-native';
import { Card } from '../Card';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { ContinueItem } from '../../types/home';
import { CONTINUE_CARD_WIDTH, resolveContinueAccent } from './homeUtils';
import { homePremiumCard } from './homeStyles';

type ContinueRowProps = {
  items: ContinueItem[];
  onItemPress?: (deeplink: string) => void;
};

function continueIcon(kind: ContinueItem['kind']) {
  if (kind === 'video') return Video;
  if (kind === 'test') return BookOpen;
  return Play;
}

function accentBg(accent: ContinueItem['accent'], theme: ReturnType<typeof useTheme>['theme']) {
  switch (accent) {
    case 'teal':
      return theme.colors.accent.tealMuted;
    case 'gold':
      return theme.colors.accent.goldMuted;
    case 'coral':
      return theme.colors.accent.coralMuted;
    default:
      return theme.colors.brand.primaryMuted;
  }
}

function progressGradient(accent: ContinueItem['accent']): [string, string] {
  if (accent === 'teal') return ['#16C6B0', '#0FA896'];
  if (accent === 'gold') return ['#F2A516', '#C97E00'];
  if (accent === 'coral') return ['#F2554B', '#E0453C'];
  return ['#5B57E8', '#3A36CC'];
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
        track: {
          height: 7,
          borderRadius: 99,
          backgroundColor: theme.colors.border.subtle,
          overflow: 'hidden',
        },
        fill: {
          height: '100%',
          borderRadius: 99,
        },
      }),
    [theme],
  );
  const fillWidth = `${Math.min(Math.max(value, 0), 100)}%` as `${number}%`;

  return (
    <View style={styles.track}>
      <LinearGradient
        colors={progressGradient(accent)}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.fill, { width: fillWidth }]}
      />
    </View>
  );
}

export function ContinueRow({ items, onItemPress }: ContinueRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const renderItem = useCallback<ListRenderItem<ContinueItem>>(
    ({ item }) => {
      const Icon = continueIcon(item.kind);
      const accentColor = resolveContinueAccent(item.accent, theme.colors);

      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => onItemPress?.(item.deeplink)}
          style={styles.cardWrap}
        >
          <Card padded={false} style={styles.card}>
            <View style={styles.top}>
              <View style={[styles.iconWrap, { backgroundColor: accentBg(item.accent, theme) }]}>
                <Icon size={20} color={accentColor} strokeWidth={1.8} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
            <ContinueProgressBar value={item.progressPct} accent={item.accent} />
          </Card>
        </Pressable>
      );
    },
    [onItemPress, styles, theme],
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
      marginHorizontal: -theme.spacing.lg,
    },
    listContent: {
      gap: 12,
      paddingHorizontal: theme.spacing.lg,
    },
    cardWrap: {
      width: CONTINUE_CARD_WIDTH,
    },
    card: {
      padding: 15,
      gap: 12,
      borderRadius: 22,
      ...homePremiumCard(theme),
      borderWidth: 0,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 13,
      lineHeight: 16,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: theme.colors.text.primary,
    },
    subtitle: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
  });
}
