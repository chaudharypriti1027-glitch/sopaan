import { LinearGradient } from 'expo-linear-gradient';
import { BarChart2, Bookmark, Clock, Eye, Flame } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { OptimizedImage } from '../OptimizedImage';
import { Text } from '../Text';
import type { CurrentAffair } from '../../api/types';
import { CA_UI } from './caTheme';
import {
  affairTags,
  categoryStyle,
  estimateReadTime,
  formatViewCount,
  getExamWeight,
  isTrendingAffair,
} from './caUtils';

type CurrentAffairCardProps = {
  item: CurrentAffair;
  saved: boolean;
  categoryLabel: string;
  formattedDate: string;
  onPress?: () => void;
  onToggleSave: () => void;
};

function AffairThumb({ item, trending }: { item: CurrentAffair; trending: boolean }) {
  const styles = useMemo(() => createThumbStyles(), []);

  if (item.imageUrl) {
    return (
      <View style={styles.thumbWrap}>
        <OptimizedImage uri={item.imageUrl} style={styles.thumb} />
        {trending ? (
          <View style={styles.hotBadge}>
            <Flame size={7} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.hotText}>HOT</Text>
          </View>
        ) : null}
      </View>
    );
  }

  const style = categoryStyle(item.category);
  return (
    <View style={styles.thumbWrap}>
      <LinearGradient
        colors={[style.color, `${style.color}CC`]}
        style={styles.thumb}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {trending ? (
        <View style={styles.hotBadge}>
          <Flame size={7} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.hotText}>HOT</Text>
        </View>
      ) : null}
    </View>
  );
}

export function CurrentAffairCard({
  item,
  saved,
  categoryLabel,
  formattedDate,
  onPress,
  onToggleSave,
}: CurrentAffairCardProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);
  const trending = isTrendingAffair(item);
  const examWeight = getExamWeight(item);
  const catStyle = categoryStyle(item.category);
  const tags = affairTags(item);
  const readTime = estimateReadTime(item);
  const views = formatViewCount(item.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('currentAffairs.readArticle')}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.wrap, pressed && onPress && styles.pressed]}
    >
      <View style={styles.cardTop}>
        <AffairThumb item={item} trending={trending} />
        <View style={styles.cardInfo}>
          <View style={styles.badges}>
            <View style={[styles.catBadge, { backgroundColor: catStyle.bg }]}>
              <Text style={[styles.catBadgeText, { color: catStyle.color }]}>
                {categoryLabel.toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.examBadge,
                examWeight === 'High' ? styles.examHigh : styles.examMed,
              ]}
            >
              <BarChart2
                size={7}
                color={examWeight === 'High' ? CA_UI.examHigh : CA_UI.examMed}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.examBadgeText,
                  examWeight === 'High' ? styles.examHighText : styles.examMedText,
                ]}
              >
                {examWeight === 'High' ? t('currentAffairs.examHigh') : t('currentAffairs.examMed')}
              </Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={3}>
            {item.title}
          </Text>
        </View>
      </View>

      {item.summary ? (
        <Text style={styles.excerpt} numberOfLines={2}>
          {item.summary}
        </Text>
      ) : null}

      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.meta}>
          {item.source ? <Text style={styles.metaText}>{item.source}</Text> : null}
          {item.source ? <Text style={styles.dot}>·</Text> : null}
          <View style={styles.metaItem}>
            <Clock size={9} color={CA_UI.faint} strokeWidth={2.5} />
            <Text style={styles.metaText}>{readTime}</Text>
          </View>
          <Text style={styles.dot}>·</Text>
          <View style={styles.metaItem}>
            <Eye size={9} color={CA_UI.faint} strokeWidth={2.5} />
            <Text style={styles.metaText}>{views}</Text>
          </View>
        </View>
        <View style={styles.right}>
          {formattedDate ? <Text style={styles.date}>{formattedDate}</Text> : null}
          <Pressable
            accessibilityLabel={t('currentAffairs.bookmarkA11y')}
            onPress={(event) => {
              event.stopPropagation?.();
              onToggleSave();
            }}
            hitSlop={8}
            style={[styles.bookmarkBtn, saved && styles.bookmarkSaved]}
          >
            <Bookmark
              size={14}
              color={saved ? CA_UI.accent : CA_UI.faint}
              fill={saved ? CA_UI.accent : 'transparent'}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function createThumbStyles() {
  return StyleSheet.create({
    thumbWrap: {
      position: 'relative',
      flexShrink: 0,
    },
    thumb: {
      width: 72,
      height: 72,
      borderRadius: 12,
      overflow: 'hidden',
    },
    hotBadge: {
      position: 'absolute',
      top: 4,
      left: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: CA_UI.hot,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    hotText: {
      fontSize: 7,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
  });
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      backgroundColor: CA_UI.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: CA_UI.border,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    pressed: { opacity: 0.94 },
    cardTop: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 10,
    },
    cardInfo: {
      flex: 1,
      gap: 6,
    },
    badges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
    },
    catBadge: {
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    catBadgeText: {
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    examBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1,
    },
    examHigh: {
      backgroundColor: CA_UI.examHighBg,
      borderColor: CA_UI.examHighBorder,
    },
    examMed: {
      backgroundColor: CA_UI.examMedBg,
      borderColor: CA_UI.examMedBorder,
    },
    examBadgeText: {
      fontSize: 8,
      fontWeight: '700',
    },
    examHighText: { color: CA_UI.examHigh },
    examMedText: { color: CA_UI.examMed },
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: CA_UI.text,
      lineHeight: 18,
      letterSpacing: -0.2,
    },
    excerpt: {
      fontSize: 11,
      lineHeight: 16,
      color: CA_UI.muted,
      marginBottom: 8,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 10,
    },
    tag: {
      fontSize: 10,
      fontWeight: '600',
      color: CA_UI.faint,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: CA_UI.border,
      paddingTop: 10,
    },
    meta: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    metaText: {
      fontSize: 10,
      fontWeight: '500',
      color: CA_UI.faint,
    },
    dot: {
      fontSize: 10,
      color: '#CBD5E1',
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginLeft: 8,
    },
    date: {
      fontSize: 10,
      fontWeight: '600',
      color: CA_UI.faint,
    },
    bookmarkBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8FAFC',
    },
    bookmarkSaved: {
      backgroundColor: CA_UI.accentSoft,
    },
  });
}
