import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import { PracticeHeaderAmbient } from './PracticeHeaderAmbient';
import { PRACTICE_UI } from './practiceTheme';

type PracticeHeaderProps = {
  /** Kept optional for API compatibility — the compact header omits it. */
  eyebrow?: string;
  title: string;
  subtitle: string;
  aiCard: ReactNode;
};

/** Compact navy hero — title, one-line subtitle, gold signature, AI action. */
export function PracticeHeader({ title, subtitle, aiCard }: PracticeHeaderProps) {
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

      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDiamond} />
          <View style={styles.dividerLine} />
        </View>
      </View>
      <Text style={styles.subtitle} numberOfLines={1}>
        {subtitle}
      </Text>

      <View style={styles.aiWrap}>{aiCard}</View>
    </LinearGradient>
  );
}

function createStyles(topInset: number) {
  return StyleSheet.create({
    gradient: {
      paddingTop: topInset + 12,
      paddingHorizontal: 20,
      paddingBottom: 22,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      overflow: 'hidden',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: '#FFFFFF',
      lineHeight: 31,
      letterSpacing: -0.4,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    dividerLine: {
      width: 22,
      height: StyleSheet.hairlineWidth + 0.5,
      backgroundColor: PRACTICE_UI.gold,
      opacity: 0.7,
    },
    dividerDiamond: {
      width: 4,
      height: 4,
      backgroundColor: PRACTICE_UI.gold,
      transform: [{ rotate: '45deg' }],
      shadowColor: PRACTICE_UI.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 5,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: 'rgba(233,222,196,0.75)',
      marginTop: 4,
      marginBottom: 16,
    },
    aiWrap: {
      marginTop: 0,
    },
  });
}
