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
          <Target size={22} color="#EF4444" strokeWidth={2} />
        </View>

        <View style={styles.copy}>
          {showForYouHeader ? (
            <View style={styles.titleRow}>
              <Text style={styles.forYou}>For You</Text>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
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
            <View style={styles.warnRow}>
              <View style={styles.warnDot} />
              <Text style={styles.warnText} numberOfLines={2}>
                {nudge.body}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.arrow}>
          <ChevronRight size={15} color={HOME_UI.accent} strokeWidth={2.2} />
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      borderRadius: 22,
    },
    pressed: { opacity: 0.96 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: HOME_UI.surface,
      borderRadius: 22,
      paddingVertical: 15,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: HOME_UI.borderSoft,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.13,
      shadowRadius: 28,
      elevation: 4,
    },
    icon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: '#FEF2F2',
      borderWidth: 1.5,
      borderColor: '#FECACA',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
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
      color: HOME_UI.ink,
    },
    aiBadge: {
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    aiBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.6,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: '700',
      color: HOME_UI.ink,
      lineHeight: 18,
      marginBottom: 4,
    },
    warnRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 5,
    },
    warnDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#EF4444',
      marginTop: 5,
      flexShrink: 0,
    },
    warnText: {
      flex: 1,
      fontSize: 11,
      fontWeight: '600',
      color: '#EF4444',
      lineHeight: 15,
    },
    arrow: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: HOME_UI.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
  });
}
