import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Calendar, Flame } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../Avatar';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { colors } from '../../theme/tokens';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { HOME_UI } from './homeTheme';

type GreetingHeaderProps = {
  greeting: HomeFeed['greeting'];
  streak: HomeFeed['streak'];
  countdown?: HomeFeed['countdown'];
  onNotificationsPress?: () => void;
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function greetingHi(message: string) {
  if (/morning/i.test(message)) {
    return `${message} ☀️`;
  }
  return message;
}

function streakChipLabel(current: number) {
  if (current <= 0) {
    return { prefix: 'Start', suffix: 'your streak' };
  }
  return { prefix: String(current), suffix: current === 1 ? '-day streak' : '-day streak' };
}

export function GreetingHeader({
  greeting,
  streak,
  countdown,
  onNotificationsPress,
}: GreetingHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const avatarSource = greeting.avatarUrl ? { uri: greeting.avatarUrl } : undefined;
  const streakParts = streakChipLabel(streak.current);

  return (
    <LinearGradient
      colors={[...HOME_UI.heroGradient]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.decorA} />
      <View style={styles.decorB} />

      <View style={styles.greetRow}>
        <LinearGradient
          colors={['#FFD98A', '#F2A516']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarBorder}
        >
          <Avatar
            name={greeting.name}
            source={avatarSource}
            size="md"
            style={styles.avatar}
          />
        </LinearGradient>

        <View style={styles.textBlock}>
          <Text style={styles.hiLine}>{greetingHi(greeting.message)}</Text>
          <Text style={styles.nameLine}>{firstName(greeting.name)}</Text>
        </View>

        {onNotificationsPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={onNotificationsPress}
            style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
          >
            <Bell size={20} color={colors.white} strokeWidth={1.75} />
            {greeting.unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
          </Pressable>
        ) : null}
      </View>

      <View style={styles.chips}>
        <View style={styles.chip}>
          <Flame size={14} color="#FFD98A" strokeWidth={1.75} />
          <NumText style={styles.chipNum}>{streakParts.prefix}</NumText>
          <Text style={styles.chipText}>{streakParts.suffix}</Text>
        </View>

        {countdown ? (
          <View style={styles.chip} testID="home-section-countdown">
            <Calendar size={14} color={colors.white} strokeWidth={1.75} />
            <NumText style={styles.chipNum}>{countdown.daysLeft}</NumText>
            <Text style={styles.chipText}>days to exam</Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], topInset: number) {
  return StyleSheet.create({
    gradient: {
      marginHorizontal: -theme.spacing.lg,
      paddingTop: topInset + 12,
      paddingHorizontal: 20,
      paddingBottom: 56,
      overflow: 'hidden',
    },
    decorA: {
      position: 'absolute',
      top: -60,
      right: -40,
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: 'rgba(194,154,78,0.22)',
    },
    decorB: {
      position: 'absolute',
      bottom: -40,
      left: -40,
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    greetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      zIndex: 2,
    },
    avatarBorder: {
      padding: 2.5,
      borderRadius: 17,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 15,
    },
    textBlock: {
      flex: 1,
      gap: 1,
    },
    hiLine: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      letterSpacing: 0.2,
      color: 'rgba(255,255,255,0.72)',
    },
    nameLine: {
      fontSize: 20,
      lineHeight: 22,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.4,
      color: colors.white,
    },
    bell: {
      width: 43,
      height: 43,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.13)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    unreadDot: {
      position: 'absolute',
      top: 9,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.accent.gold,
      borderWidth: 2,
      borderColor: theme.colors.brand.primary,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.97 }],
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
      marginTop: 18,
      zIndex: 2,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: theme.radii.pill,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.13)',
    },
    chipNum: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.stat.semibold,
      fontWeight: '700',
      color: colors.white,
    },
    chipText: {
      fontSize: 11.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: colors.white,
    },
  });
}
