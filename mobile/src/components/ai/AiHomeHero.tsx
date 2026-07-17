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
      <LinearGradient
        colors={[...AI_UI.heroGradient]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.icon}
      >
        <Sparkles size={22} color={AI_UI.gold} strokeWidth={2.2} />
      </LinearGradient>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 18,
      gap: 6,
    },
    icon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.28)',
      marginBottom: 4,
    },
    title: {
      fontSize: 20,
      lineHeight: 26,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: AI_UI.ink,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 19,
      fontFamily: theme.typography.fonts.ui.medium,
      fontWeight: '500',
      color: AI_UI.sub,
      textAlign: 'center',
      maxWidth: 260,
    },
  });
}
