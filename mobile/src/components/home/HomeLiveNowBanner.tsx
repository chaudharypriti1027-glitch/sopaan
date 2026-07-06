import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Radio, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { HomeSlotIcon } from './HomePremiumIcon';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { LiveClass } from '../../api/liveClasses';
import { platformShadow } from '../../utils/platformShadow';
import { HOME_UI, homePressFeedback } from './homeTheme';

type HomeLiveNowBannerProps = {
  liveClass: LiveClass;
  onPress: () => void;
};

export function HomeLiveNowBanner({ liveClass, onPress }: HomeLiveNowBannerProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const viewerCount = liveClass.attendeeCount ?? liveClass.viewers ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && homePressFeedback]}
      testID="home-live-now-banner"
    >
      <LinearGradient
        colors={[...HOME_UI.heroGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <HomeSlotIcon slot="hero" Icon={Radio} tone="gold" />

        <View style={styles.copy}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>{t('liveClasses.liveNow')}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {liveClass.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta} numberOfLines={1}>
              {liveClass.instructor}
            </Text>
            <View style={styles.viewers}>
              <HomeSlotIcon slot="inline" Icon={Users} tone="slate" />
              <Text style={styles.viewerText}>
                {t('liveClasses.watching', { count: viewerCount })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaWrap}>
          <Text style={styles.cta}>{t('home.joinLive')}</Text>
          <HomeSlotIcon slot="button" Icon={ChevronRight} tone="gold" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: HOME_UI.horizontalPad,
      marginTop: -12,
      marginBottom: 10,
      zIndex: 5,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: 'rgba(226,201,127,0.22)',
      ...platformShadow({ color: HOME_UI.accent, offsetY: 12, opacity: 0.35, radius: 18, elevation: 6 }),
    },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 5,
      backgroundColor: '#D64545',
      borderRadius: 99,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginBottom: 4,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
    },
    livePillText: {
      fontSize: 9,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.4,
      color: '#FFFFFF',
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    title: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    meta: {
      flexShrink: 1,
      fontSize: 11,
      color: 'rgba(255,255,255,0.7)',
    },
    viewers: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
    },
    viewerText: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.65)',
    },
    ctaWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      flexShrink: 0,
    },
    cta: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: HOME_UI.goldLt,
    },
  });
}
