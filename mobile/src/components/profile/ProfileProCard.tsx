import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { useTheme } from '../../theme';

type ProfileProCardProps = {
  onPress?: () => void;
};

export function ProfileProCard({ onPress }: ProfileProCardProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('profile.proA11y')}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={['#2E2AB6', '#211F84']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.decor} />
        <LinearGradient
          colors={['#FFC24A', '#F2A516']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconWrap}
        >
          <Crown size={24} color="#FFFFFF" strokeWidth={1.75} />
        </LinearGradient>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{t('profile.proTitle')}</Text>
          <Text style={styles.subtitle}>{t('profile.proSubtitle')}</Text>
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{t('profile.proCta')}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      borderRadius: 22,
      overflow: 'hidden',
      shadowColor: '#221F84',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 8,
    },
    pressed: {
      opacity: 0.95,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      padding: 17,
      borderRadius: 22,
      overflow: 'hidden',
    },
    decor: {
      position: 'absolute',
      top: -40,
      right: -20,
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: 'rgba(242,165,22,0.22)',
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
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
      color: 'rgba(255,255,255,0.85)',
    },
    cta: {
      zIndex: 2,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 15,
    },
    ctaText: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#211E78',
    },
  });
}
