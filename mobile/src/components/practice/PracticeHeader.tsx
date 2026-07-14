import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import { PracticeHeaderAmbient } from './PracticeHeaderAmbient';
import { PRACTICE_UI } from './practiceTheme';

type PracticeHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  aiCard: ReactNode;
};

export function PracticeHeader({ eyebrow, title, subtitle, aiCard }: PracticeHeaderProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);

  return (
    <LinearGradient
      colors={[PRACTICE_UI.headerStart, PRACTICE_UI.headerMid, PRACTICE_UI.headerEnd]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.gradient}
    >
      <PracticeHeaderAmbient />

      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.hairline} />

      <View style={styles.aiWrap}>{aiCard}</View>
    </LinearGradient>
  );
}

function createStyles(topInset: number) {
  return StyleSheet.create({
    gradient: {
      paddingTop: topInset + 10,
      paddingHorizontal: 20,
      paddingBottom: 28,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      overflow: 'hidden',
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: PRACTICE_UI.eyebrow,
      marginBottom: 4,
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: '#FFFFFF',
      lineHeight: 33,
      marginBottom: 2,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: 'rgba(255,255,255,0.9)',
      marginBottom: 10,
    },
    hairline: {
      width: 44,
      height: 2,
      borderRadius: 99,
      backgroundColor: PRACTICE_UI.gold,
      marginBottom: 16,
      opacity: 0.85,
    },
    aiWrap: {
      marginTop: 2,
    },
  });
}
