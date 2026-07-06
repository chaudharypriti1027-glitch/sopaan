import { LinearGradient } from 'expo-linear-gradient';
import { BarChart2, Bookmark, ChevronRight, Clock, Eye, Flame } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { OptimizedImage } from '../OptimizedImage';
import { Text } from '../Text';
import type { CurrentAffair } from '../../api/types';
import { CA_UI, caFeedCard, caPressFeedback } from './caTheme';
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

  const thumbBody = item.imageUrl ? (
    <OptimizedImage uri={item.imageUrl} style={styles.thumb} />
  ) : (
    <LinearGradient
      colors={[categoryStyle(item.category).color, `${categoryStyle(item.category).color}BB`]}
      style={styles.thumb}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
    />
  );

  return (
    <View style={styles.thumbPlate}>
      <View style={styles.thumbWrap}>
        {thumbBody}
        <View style={styles.thumbSheen} pointerEvents="none" />
        <View style={styles.thumbRim} pointerEvents="none" />
        {trending ? (
          <LinearGradient
            colors={[CA_UI.goldLt, CA_UI.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hotBadge}
          >
            <Flame size={7} color="#2A2110" fill="#2A2110" />
            <Text style={styles.hotText}>HOT</Text>
          </LinearGradient>
        ) : null}
      </View>
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
      style={({ pressed }) => [styles.wrap, pressed && onPress && caPressFeedback]}
    >
      {trending ? (
        <LinearGradient
          colors={[CA_UI.goldLt, CA_UI.gold]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.topAccent}
        />
      ) : null}

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
                size={8}
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
        <View style={styles.readChip}>
          <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
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
    thumbPlate: {
      flexShrink: 0,
    },
    thumbWrap: {
      position: 'relative',
      borderRadius: 14,
      overflow: 'hidden',
    },
    thumb: {
      width: 76,
      height: 76,
      borderRadius: 14,
    },
    thumbSheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '42%',
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    thumbRim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 3,
      backgroundColor: 'rgba(0,0,0,0.12)',
    },
    hotBadge: {
      position: 'absolute',
      top: 5,
      left: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    hotText: {
      fontSize: 7,
      fontWeight: '800',
      color: '#2A2110',
      letterSpacing: 0.3,
    },
  });
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      ...caFeedCard({ marginBottom: 12, padding: 14 }),
    },
    topAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
    },
    cardTop: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 10,
      alignItems: 'flex-start',
    },
    cardInfo: {
      flex: 1,
      gap: 6,
    },
    readChip: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: CA_UI.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
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
      fontSize: 14,
      fontWeight: '800',
      color: CA_UI.text,
      lineHeight: 19,
      letterSpacing: -0.25,
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
      fontWeight: '600',
      color: CA_UI.faint,
    },
    dot: {
      fontSize: 10,
      color: CA_UI.borderStrong,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginLeft: 8,
    },
    date: {
      fontSize: 10,
      fontWeight: '700',
      color: CA_UI.muted,
    },
    bookmarkBtn: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CA_UI.bg,
      borderWidth: 1,
      borderColor: CA_UI.border,
    },
    bookmarkSaved: {
      backgroundColor: CA_UI.accentSoft,
      borderColor: CA_UI.borderStrong,
    },
  });
}
