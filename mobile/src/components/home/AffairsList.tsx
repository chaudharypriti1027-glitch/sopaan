import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { OptimizedImage } from '../OptimizedImage';
import { HomeSlotIcon } from './HomePremiumIcon';
import { Text } from '../Text';
import type { AffairCard } from '../../types/home';
import { affairIconTone, resolveAffairIcon } from './homeIcons';
import { homeFeedCard, HOME_UI, homePressFeedback } from './homeTheme';

type AffairsListProps = {
  items: AffairCard[];
  onItemPress?: (affairId: string) => void;
};

function AffairThumb({
  item,
  index,
}: {
  item: AffairCard;
  index: number;
}) {
  const styles = useMemo(() => createThumbStyles(), []);

  if (item.imageUrl) {
    return (
      <View style={styles.thumbWrap}>
        <OptimizedImage uri={item.imageUrl} style={styles.thumbImage} contentFit="cover" />
      </View>
    );
  }

  const Icon = resolveAffairIcon(index);
  const tone = affairIconTone(index);

  return (
    <View style={styles.thumbWrap}>
      <HomeSlotIcon slot="shortcut" Icon={Icon} tone={tone} />
    </View>
  );
}

export function AffairsList({ items, onItemPress }: AffairsListProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      {items.slice(0, 3).map((item, index) => (
        <View key={item.id}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => onItemPress?.(item.id)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <AffairThumb item={item} index={index} />
            <View style={styles.content}>
              <Text style={styles.source} numberOfLines={1}>
                {item.source}
              </Text>
              <Text style={styles.headline} numberOfLines={2} ellipsizeMode="tail">
                {item.headline}
              </Text>
              <View style={styles.timeRow}>
                <Clock size={11} color={HOME_UI.muted} strokeWidth={2.2} />
                <Text style={styles.readTime}>{t('home.readMin', { count: item.readMin })}</Text>
              </View>
            </View>
            <ChevronRight size={16} color={HOME_UI.muted} strokeWidth={2.2} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function createThumbStyles() {
  return StyleSheet.create({
    thumbWrap: {
      width: 54,
      height: 54,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
      backgroundColor: HOME_UI.tileBg,
      borderWidth: 1,
      borderColor: HOME_UI.borderSoft,
    },
    thumbImage: {
      width: '100%',
      height: '100%',
      borderRadius: 14,
    },
  });
}

function createStyles() {
  return StyleSheet.create({
    card: {
      paddingVertical: 2,
      ...homeFeedCard(),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    pressed: homePressFeedback,
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: HOME_UI.border,
      marginLeft: 80,
      marginRight: 14,
    },
    content: { flex: 1, minWidth: 0, gap: 3 },
    source: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.55,
      textTransform: 'uppercase',
      color: HOME_UI.sageDeep,
    },
    headline: {
      fontSize: 14,
      fontWeight: '700',
      color: HOME_UI.ink,
      lineHeight: 18,
      letterSpacing: -0.15,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    readTime: {
      fontSize: 11,
      color: HOME_UI.muted,
      fontWeight: '600',
    },
  });
}
