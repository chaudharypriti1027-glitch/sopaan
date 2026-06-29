import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { OptimizedImage } from '../OptimizedImage';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { AffairCard } from '../../types/home';
import { HOME_UI } from './homeTheme';

type AffairsListProps = {
  items: AffairCard[];
  onItemPress?: (affairId: string) => void;
};

const SOURCE_COLORS = ['#EA580C', '#2563EB', '#16A34A', '#7C3AED', '#DB2777'];
const THUMB_EMOJI = ['🏛️', '📈', '🏠', '🌐', '⚖️'];
const THUMB_STYLES = [
  { bg: '#FFF7ED', border: '#FED7AA' },
  { bg: '#EFF6FF', border: '#BFDBFE' },
  { bg: '#F0FDF4', border: '#BBF7D0' },
  { bg: '#F5F3FF', border: '#DDD6FE' },
  { bg: '#FDF2F8', border: '#FBCFE8' },
];

function AffairThumb({
  item,
  index,
}: {
  item: AffairCard;
  index: number;
}) {
  const styles = useMemo(() => createThumbStyles(), []);
  const thumb = THUMB_STYLES[index % THUMB_STYLES.length];

  if (item.imageUrl) {
    return (
      <View style={styles.thumbWrap}>
        <OptimizedImage uri={item.imageUrl} style={styles.thumbImage} contentFit="cover" />
      </View>
    );
  }

  if (item.imageColor) {
    return (
      <View style={styles.thumbWrap}>
        <LinearGradient
          colors={[item.imageColor, `${item.imageColor}CC`]}
          style={styles.thumbImage}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.thumbWrap, { backgroundColor: thumb.bg, borderColor: thumb.border }]}>
      <Text style={styles.thumbEmoji}>{THUMB_EMOJI[index % THUMB_EMOJI.length]}</Text>
    </View>
  );
}

export function AffairsList({ items, onItemPress }: AffairsListProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      {items.slice(0, 3).map((item, index) => {
        const sourceColor = SOURCE_COLORS[index % SOURCE_COLORS.length];

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
                <Text style={[styles.source, { color: sourceColor }]}>{item.source}</Text>
                <Text style={styles.headline} numberOfLines={2}>
                  {item.headline}
                </Text>
                <View style={styles.timeRow}>
                  <Clock size={11} color="#C4CBD8" strokeWidth={2.2} />
                  <Text style={styles.readTime}>{t('home.readMin', { count: item.readMin })}</Text>
                </View>
              </View>
              <ChevronRight size={15} color="#C4CBD8" strokeWidth={2.2} style={styles.chev} />
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
      width: 54,
      height: 54,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: HOME_UI.border,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
    },
    thumbImage: {
      width: '100%',
      height: '100%',
      borderRadius: 14,
    },
    thumbEmoji: { fontSize: 24 },
  });
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      backgroundColor: HOME_UI.surface,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: HOME_UI.border,
      overflow: 'hidden',
      shadowColor: '#0F143C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 13,
      paddingVertical: 15,
      paddingHorizontal: 16,
    },
    pressed: { opacity: 0.96 },
    divider: {
      height: 1,
      backgroundColor: '#F3F6FB',
      marginLeft: 83,
    },
    content: { flex: 1, minWidth: 0 },
    source: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    headline: {
      fontSize: 13,
      fontWeight: '600',
      color: HOME_UI.ink,
      lineHeight: 19,
      marginBottom: 6,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    readTime: {
      fontSize: 11,
      color: HOME_UI.muted,
      fontWeight: '500',
    },
    chev: { marginTop: 2, flexShrink: 0 },
  });
}
