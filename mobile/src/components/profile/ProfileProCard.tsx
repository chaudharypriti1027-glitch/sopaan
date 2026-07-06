import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Home } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { ShimmerOverlay } from './ShimmerOverlay';
import { PROFILE } from './profileTheme';

type ProfileProCardProps = {
  isPremium?: boolean;
  onPress?: () => void;
};

export function ProfileProCard({ isPremium = false, onPress }: ProfileProCardProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const title = isPremium ? t('profile.proActiveTitle') : t('profile.proTitle');
  const subtitle = isPremium ? t('profile.proActiveSubtitle') : t('profile.proSubtitle');
  const cta = isPremium ? t('profile.proManageCta') : t('profile.proCta');
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
        <LinearGradient
          colors={[PROFILE.goldLt, PROFILE.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconWrap}
        >
          {isPremium ? (
            <Crown size={24} color="#FFFFFF" strokeWidth={1.75} />
          ) : (
            <Home size={24} color="#FFFFFF" strokeWidth={1.75} />
          )}
        </LinearGradient>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <LinearGradient
          colors={[PROFILE.goldLt, PROFILE.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{cta}</Text>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      borderRadius: PROFILE.cardRadius,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(226,201,127,0.16)',
      shadowColor: PROFILE.navyDeep,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.45,
      shadowRadius: 24,
      elevation: 10,
    },
    pressed: {
      opacity: 0.96,
      transform: [{ scale: 0.99 }],
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      padding: 17,
      borderRadius: PROFILE.cardRadius,
      overflow: 'hidden',
    },
    decor: {
      position: 'absolute',
      top: -40,
      right: -20,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(194,154,78,0.28)',
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      shadowColor: PROFILE.gold,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 10,
      elevation: 4,
    },
    textWrap: {
      flex: 1,
      zIndex: 2,
    },
    title: {
      fontSize: 15,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: '#FFFFFF',
    },
    subtitle: {
      marginTop: 2,
      fontSize: 11.5,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.82)',
    },
    cta: {
      zIndex: 2,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 15,
    },
    ctaText: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#2A2110',
    },
  });
}
