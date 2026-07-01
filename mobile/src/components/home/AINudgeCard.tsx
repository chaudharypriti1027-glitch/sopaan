import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Target } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { AINudge } from '../../types/home';
import { HOME_UI } from './homeTheme';

type AINudgeCardProps = {
  nudge: AINudge;
  onPress?: (deeplink: string) => void;
  showForYouHeader?: boolean;
};

export function AINudgeCard({ nudge, onPress, showForYouHeader = true }: AINudgeCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isUrgent = nudge.tone === 'urgent';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(nudge.deeplink)}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <View style={styles.card}>
        <View style={styles.icon}>
          <Target size={22} color={HOME_UI.goldDeep} strokeWidth={2} />
        </View>

        <View style={styles.copy}>
          {showForYouHeader ? (
            <View style={styles.titleRow}>
              <Text style={styles.forYou}>For You</Text>
              <LinearGradient
                colors={[...HOME_UI.accentGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiBadge}
              >
                <Text style={styles.aiBadgeText}>✦ AI</Text>
              </LinearGradient>
            </View>
          ) : null}
          <Text style={styles.subtitle} numberOfLines={2}>
            {nudge.title}
          </Text>
          {isUrgent || nudge.body ? (
            <Text style={styles.bodyText} numberOfLines={2}>
              {nudge.body}
            </Text>
          ) : null}
        </View>

        <View style={styles.arrow}>
          <ChevronRight size={16} color={HOME_UI.goldDeep} strokeWidth={2.4} />
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      borderRadius: 20,
    },
    pressed: { opacity: 0.96 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      backgroundColor: HOME_UI.goldSoft,
      borderRadius: 20,
      paddingVertical: 15,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: '#EADFC4',
      shadowColor: HOME_UI.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 3,
    },
    icon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      shadowColor: HOME_UI.goldDeep,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 2,
    },
    copy: { flex: 1, minWidth: 0 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 5,
    },
    forYou: {
      fontSize: 14,
      fontWeight: '800',
      color: HOME_UI.accent,
    },
    aiBadge: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    aiBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.6,
    },
    subtitle: {
      fontSize: 13.5,
      fontWeight: '800',
      color: HOME_UI.accent,
      lineHeight: 18,
      marginBottom: 2,
    },
    bodyText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: HOME_UI.goldDeep,
      lineHeight: 15,
    },
    arrow: {
      opacity: 0.7,
    },
  });
}
