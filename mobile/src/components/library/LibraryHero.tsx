import { useMemo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, ChevronLeft, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { LIBRARY_UI } from './libraryTheme';

type LibraryHeroProps = {
  booksCount: number;
  downloadedCount: number;
  readingCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  onBack: () => void;
  onSavedPress?: () => void;
  savedActive?: boolean;
};

export function LibraryHero({
  booksCount,
  downloadedCount,
  readingCount,
  query,
  onQueryChange,
  onBack,
  onSavedPress,
  savedActive = false,
}: LibraryHeroProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  const stats = [
    { key: 'books', value: booksCount, label: t('books.statsBooks') },
    { key: 'downloaded', value: downloadedCount, label: t('books.statsDownloaded') },
    { key: 'reading', value: readingCount, label: t('books.statsReading') },
  ];

  return (
    <LinearGradient
      colors={[...LIBRARY_UI.heroGradient]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.blob} />

      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common:back')}
          onPress={onBack}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>{t('books.headerTitle')}</Text>
          <Text style={styles.subtitle}>{t('books.headerSubtitle')}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('books.saved')}
          accessibilityState={{ selected: savedActive }}
          onPress={onSavedPress}
          style={({ pressed }) => [
            styles.iconBtn,
            savedActive && styles.iconBtnActive,
            pressed && styles.pressed,
          ]}
        >
          <Bookmark size={18} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.search}>
        <Search size={18} color="rgba(255,255,255,0.7)" strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder={t('books.searchPlaceholder')}
          placeholderTextColor="rgba(255,255,255,0.55)"
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <View key={stat.key} style={[styles.statCell, index > 0 && styles.statBorder]}>
            <NumText style={styles.statValue}>{stat.value}</NumText>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], topInset: number) {
  return StyleSheet.create({
    hero: {
      paddingTop: topInset + 8,
      paddingHorizontal: 20,
      paddingBottom: 60,
      overflow: 'hidden',
      borderBottomLeftRadius: LIBRARY_UI.heroRadius,
      borderBottomRightRadius: LIBRARY_UI.heroRadius,
    },
    blob: {
      position: 'absolute',
      top: -60,
      right: -40,
      width: 200,
      height: 200,
      borderRadius: 999,
      backgroundColor: 'rgba(194,154,78,0.2)',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 3,
    },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnActive: {
      backgroundColor: 'rgba(95,138,123,0.35)',
      borderColor: 'rgba(95,138,123,0.55)',
    },
    pressed: { opacity: 0.88 },
    titleWrap: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    title: {
      fontSize: 22,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.4,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.6)',
      marginTop: 2,
      textAlign: 'center',
    },
    search: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      borderRadius: 15,
      paddingHorizontal: 15,
      paddingVertical: 13,
      zIndex: 3,
    },
    searchInput: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 13.5,
      fontWeight: '500',
      padding: 0,
    },
    statsRow: {
      flexDirection: 'row',
      marginTop: 16,
      zIndex: 3,
    },
    statCell: {
      flex: 1,
      alignItems: 'center',
      position: 'relative',
    },
    statBorder: {
      borderLeftWidth: 1,
      borderLeftColor: 'rgba(255,255,255,0.14)',
    },
    statValue: {
      fontSize: 18,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    statLabel: {
      fontSize: 9.5,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.55)',
      marginTop: 2,
      letterSpacing: 0.3,
    },
  });
}
