import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AI_UI } from './aiTheme';

type AiHomeHeroProps = {
  title: string;
  subtitle: string;
};

export function AiHomeHero({ title, subtitle }: AiHomeHeroProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconShell}>
        <LinearGradient
          colors={[AI_UI.primaryLight, '#C0C4DB']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.iconGradient}
        >
          <View style={styles.glow} />
          <Sparkles size={32} color={AI_UI.primary} />
        </LinearGradient>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      paddingTop: 28,
      paddingBottom: 32,
      gap: 8,
    },
    iconShell: {
      marginBottom: 12,
    },
    iconGradient: {
      width: 76,
      height: 76,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(194,154,78,0.25)',
      overflow: 'hidden',
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.13,
      shadowRadius: 28,
      elevation: 4,
    },
    glow: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
      // radial glow approximated
      opacity: 0.35,
    },
    title: {
      fontSize: 22,
      lineHeight: 28,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.3,
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
      maxWidth: 260,
    },
  });
}
