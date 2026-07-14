import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AI_UI } from './aiTheme';

type AiHomeHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function AiHomeHero({ eyebrow, title, subtitle }: AiHomeHeroProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <View style={styles.iconShell}>
        <LinearGradient
          colors={[...AI_UI.heroGradient]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.iconGradient}
        >
          <Sparkles size={30} color={AI_UI.gold} strokeWidth={2.2} />
        </LinearGradient>
      </View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 24,
      gap: 6,
      position: 'relative',
    },
    glow: {
      position: 'absolute',
      top: 8,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: AI_UI.goldSoft,
      opacity: 0.45,
    },
    iconShell: {
      marginBottom: 8,
      zIndex: 1,
    },
    iconGradient: {
      width: 72,
      height: 72,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(194,154,78,0.3)',
      overflow: 'hidden',
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 5,
    },
    eyebrow: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: AI_UI.goldDeep,
    },
    title: {
      fontSize: 22,
      lineHeight: 28,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.35,
      color: AI_UI.ink,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: AI_UI.sub,
      textAlign: 'center',
      maxWidth: 280,
    },
  });
}
