import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
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
      <View style={styles.decorA} />
      <View style={styles.decorB} />

      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {aiCard}
    </LinearGradient>
  );
}

function createStyles(topInset: number) {
  return StyleSheet.create({
    gradient: {
      paddingTop: topInset + 10,
      paddingHorizontal: 20,
      paddingBottom: 24,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      overflow: 'hidden',
    },
    decorA: {
      position: 'absolute',
      top: -60,
      right: -60,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(167,139,250,0.35)',
    },
    decorB: {
      position: 'absolute',
      bottom: -40,
      left: -40,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(96,165,250,0.15)',
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
    },
    subtitle: {
      fontSize: 13,
      color: PRACTICE_UI.eyebrow,
      marginBottom: 16,
    },
  });
}
