import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Crown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { ShimmerOverlay } from './ShimmerOverlay';
import { PROFILE } from './profileTheme';
import { useProGate } from '../../hooks/useProGate';

type ProfileProCardProps = {
  isPremium?: boolean;
  onPress?: () => void;
};

export function ProfileProCard({ isPremium = false, onPress }: ProfileProCardProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const { tier } = useProGate();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const welcomeOffer = !isPremium && tier?.welcomeMonthEnabled !== false;

  const title = isPremium ? t('profile.proActiveTitle') : t('profile.proTitle');
  const subtitle = isPremium
    ? t('profile.proActiveSubtitle')
    : welcomeOffer
      ? t('profile.proSubtitle')
      : t('home.premiumStripSubtitleFallback');
  const cta = isPremium
    ? t('profile.proManageCta')
    : welcomeOffer
      ? t('profile.proCta')
      : t('home.premiumStripCtaUpgrade');
  const a11y = isPremium ? t('profile.proManageA11y') : t('profile.proA11y');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[PROFILE.navy2, PROFILE.navyDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.decor} />
        <ShimmerOverlay />
        <View style={styles.iconWrap}>
          <Crown size={15} color="#FFFFFF" strokeWidth={2.2} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <LinearGradient
          colors={[PROFILE.goldLt, PROFILE.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{cta}</Text>
          <ArrowRight size={13} color="#2A2110" strokeWidth={2.5} />
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(226,201,127,0.16)',
      shadowColor: PROFILE.navyDeep,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
      elevation: 8,
    },
    pressed: {
      opacity: 0.96,
      transform: [{ scale: 0.985 }],
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingLeft: 12,
      paddingRight: 10,
      paddingVertical: 12,
      borderRadius: 20,
      overflow: 'hidden',
    },
    decor: {
      position: 'absolute',
      top: -36,
      right: -18,
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: 'rgba(194,154,78,0.22)',
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(201,162,75,0.95)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
      zIndex: 2,
      flexShrink: 0,
    },
    textWrap: {
      flex: 1,
      zIndex: 2,
      minWidth: 0,
      gap: 1,
    },
    title: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.15,
      color: '#FFFFFF',
    },
    subtitle: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.78)',
    },
    cta: {
      zIndex: 2,
      flexShrink: 0,
      borderRadius: 99,
      paddingVertical: 9,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ctaText: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#2A2110',
    },
  });
}
