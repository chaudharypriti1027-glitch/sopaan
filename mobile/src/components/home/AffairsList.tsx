import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { OptimizedImage } from '../OptimizedImage';
import { Text } from '../Text';
import { toneColors, toneForIndex } from '../../utils/iconTone';
import type { AffairCard } from '../../types/home';
import { resolveAffairIcon } from './homeUtils';
import { HOME_UI } from './homeTheme';
import { platformShadow } from '../../utils/platformShadow';

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
  const tone = toneColors(toneForIndex(index));

  if (item.imageUrl) {
    return (
      <View style={styles.thumbWrap}>
        <OptimizedImage uri={item.imageUrl} style={styles.thumbImage} contentFit="cover" />
      </View>
    );
  }

  const Icon = resolveAffairIcon(index);
  const bg = item.imageColor ?? tone.bg;
  const fg = item.imageColor ? '#FFFFFF' : tone.fg;

  return (
    <View style={[styles.thumbWrap, { backgroundColor: bg }]}>
      <Icon size={21} color={fg} strokeWidth={2} />
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
      {items.slice(0, 3).map((item, index) => {
        const tone = toneColors(toneForIndex(index));

        return (
          <View key={item.id}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => onItemPress?.(item.id)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <AffairThumb item={item} index={index} />
              <View style={styles.content}>
                <Text style={[styles.source, { color: tone.fg }]}>{item.source}</Text>
                <Text style={styles.headline} numberOfLines={2}>
                  {item.headline}
                </Text>
                <View style={styles.timeRow}>
                  <Clock size={11} color={HOME_UI.muted} strokeWidth={2.2} />
                  <Text style={styles.readTime}>{t('home.readMin', { count: item.readMin })}</Text>
                </View>
              </View>
              <ChevronRight size={17} color={HOME_UI.muted} strokeWidth={2.2} style={styles.chev} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

function createThumbStyles() {
  return StyleSheet.create({
    thumbWrap: {
      width: 50,
      height: 50,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
    },
    thumbImage: {
      width: '100%',
      height: '100%',
      borderRadius: 15,
    },
  });
}

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: HOME_UI.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: HOME_UI.border,
      overflow: 'hidden',
      paddingVertical: 6,
      ...platformShadow({ color: HOME_UI.shadow, offsetY: 8, opacity: 0.08, radius: 16, elevation: 2 }),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    pressed: { opacity: 0.96 },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: HOME_UI.border,
      marginLeft: 78,
    },
    content: { flex: 1, minWidth: 0 },
    source: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 3,
    },
    headline: {
      fontSize: 12.5,
      fontWeight: '700',
      color: HOME_UI.ink,
      lineHeight: 17,
      marginBottom: 4,
      letterSpacing: -0.1,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    readTime: {
      fontSize: 10.5,
      color: HOME_UI.muted,
      fontWeight: '600',
    },
    chev: { marginTop: 2, flexShrink: 0 },
  });
}
