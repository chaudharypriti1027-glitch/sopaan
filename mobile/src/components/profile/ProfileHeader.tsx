import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SquarePen, Check, Settings, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { PremiumAvatar } from './PremiumAvatar';
import { RankRing } from '../RankRing';
import { Text } from '../Text';
import type { Profile } from '../../types/auth';
import { getXpProgress } from './profileUtils';
import { PROFILE } from './profileTheme';
import { PROFILE_MOTION } from './profileMotion';
import type { ProfileAvatarDisplay } from './useProfileAvatar';

type ProfileHeaderProps = {
  profile: Profile;
  xp?: number;
  replayKey?: number;
  avatarDisplay: ProfileAvatarDisplay;
  avatarLoading?: boolean;
  onSettingsPress?: () => void;
  onEditPress?: () => void;
  onAvatarPress?: () => void;
};

function SparkleTwinkle({
  size,
  style,
  delayMs,
}: {
  size: number;
  style?: StyleProp<ViewStyle>;
  delayMs: number;
}) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 0.85 : 0);
  const scale = useSharedValue(reducedMotion ? 1 : 0.6);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(0.85, { duration: PROFILE_MOTION.sparkleDurationMs / 2 }),
          withTiming(0, { duration: PROFILE_MOTION.sparkleDurationMs / 2 }),
        ),
        -1,
      ),
    );
    scale.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: PROFILE_MOTION.sparkleDurationMs / 2 }),
          withTiming(0.6, { duration: PROFILE_MOTION.sparkleDurationMs / 2 }),
        ),
        -1,
      ),
    );
  }, [delayMs, reducedMotion, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Sparkles size={size} color={PROFILE.goldLt} />
    </Animated.View>
  );
}

function HaloPulse({
  style,
  delayMs = 0,
}: {
  style?: StyleProp<ViewStyle>;
  delayMs?: number;
}) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 0.6 : 0.6);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(0, { duration: PROFILE_MOTION.haloDurationMs / 2 }),
          withTiming(0.6, { duration: PROFILE_MOTION.haloDurationMs / 2 }),
        ),
        -1,
      ),
    );
    scale.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: PROFILE_MOTION.haloDurationMs / 2 }),
          withTiming(1, { duration: PROFILE_MOTION.haloDurationMs / 2 }),
        ),
        -1,
      ),
    );
  }, [delayMs, reducedMotion, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]} />;
}

function ProfileAvatar({
  name,
  display,
  loading,
  onPress,
  accessibilityLabel,
}: {
  name: string;
  display: ProfileAvatarDisplay;
  loading?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const photoUri = display.kind === 'photo' ? display.uri : undefined;
  const preset = display.kind === 'preset' ? display.preset : undefined;

  return (
    <PremiumAvatar
      name={name}
      photoUri={photoUri}
      preset={preset}
      size="xl"
      variant="profile"
      showEditBadge
      loading={loading}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export function ProfileHeader({
  profile,
  xp = 0,
  replayKey = 0,
  avatarDisplay,
  avatarLoading = false,
  onSettingsPress,
  onEditPress,
  onAvatarPress,
}: ProfileHeaderProps) {
  const { t } = useTranslation(['app', 'navigation']);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const headerStyles = useMemo(() => createStyles(insets.top), [insets.top]);
  const level = profile.level ?? 1;
  const xpProgress = useMemo(() => getXpProgress(xp, level), [xp, level]);
  const emailLine = profile.email?.trim() || profile.phone;

  const avatarScale = useSharedValue(reducedMotion ? 1 : 0.7);
  const nameOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const nameTranslateY = useSharedValue(reducedMotion ? 0 : 10);

  useEffect(() => {
    if (reducedMotion) {
      avatarScale.value = 1;
      nameOpacity.value = 1;
      nameTranslateY.value = 0;
      return;
    }

    avatarScale.value = 0.7;
    avatarScale.value = withTiming(1, {
      duration: PROFILE_MOTION.avatarPopDurationMs,
      easing: PROFILE_MOTION.easePop,
    });

    nameOpacity.value = 0;
    nameTranslateY.value = 10;
    nameOpacity.value = withDelay(
      220,
      withTiming(1, { duration: 400, easing: PROFILE_MOTION.easeOut }),
    );
    nameTranslateY.value = withDelay(
      220,
      withTiming(0, { duration: 400, easing: PROFILE_MOTION.easeOut }),
    );
  }, [replayKey, reducedMotion, avatarScale, nameOpacity, nameTranslateY]);

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const nameAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslateY.value }],
  }));

  return (
    <LinearGradient
      colors={['#2E3766', '#232A4D', '#1A1F3B']}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={headerStyles.gradient}
    >
      <View style={headerStyles.decorGold} />
      <View style={headerStyles.decorSage} />
      <SparkleTwinkle size={12} delayMs={300} style={headerStyles.sparkA} />
      <SparkleTwinkle size={9} delayMs={1200} style={headerStyles.sparkB} />
      <SparkleTwinkle size={7} delayMs={2000} style={headerStyles.sparkC} />
      <SparkleTwinkle size={8} delayMs={2700} style={headerStyles.sparkD} />

      <View style={headerStyles.topbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('app:profile.menu.edit')}
          testID="profile-edit-header"
          onPress={onEditPress}
          style={({ pressed }) => [headerStyles.iconBtn, pressed && headerStyles.pressed]}
        >
          <SquarePen size={19} color="#FFFFFF" strokeWidth={1.75} />
        </Pressable>
        <Text style={headerStyles.screenTitle}>{t('navigation:profile')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('app:profile.settingsA11y')}
          testID="profile-settings"
          onPress={onSettingsPress}
          style={({ pressed }) => [headerStyles.iconBtn, pressed && headerStyles.pressed]}
        >
          <Settings size={19} color="#FFFFFF" strokeWidth={1.75} />
        </Pressable>
      </View>

      <View style={headerStyles.avatarStage}>
        <HaloPulse style={[headerStyles.halo, headerStyles.haloInner]} />
        <HaloPulse delayMs={400} style={[headerStyles.halo, headerStyles.haloOuter]} />
        <RankRing
          key={`profile-ring-${replayKey}`}
          value={Math.round(xpProgress.pct * 100)}
          max={100}
          size={100}
          strokeWidth={3}
          trackColor="rgba(255,255,255,0.12)"
          accentColor={PROFILE.goldLt}
          hideCenter
          style={headerStyles.ring}
        />
        <Animated.View style={[headerStyles.avatarPressable, avatarAnimatedStyle]}>
          <ProfileAvatar
            name={profile.name}
            display={avatarDisplay}
            loading={avatarLoading}
            onPress={onAvatarPress}
            accessibilityLabel={t('app:profile.changePhotoA11y')}
          />
        </Animated.View>
        <LinearGradient
          colors={[PROFILE.goldLt, PROFILE.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={headerStyles.levelBadge}
        >
          <Text style={headerStyles.levelBadgeText}>
            {t('app:profile.levelBadge', { level })}
          </Text>
        </LinearGradient>
      </View>

      <Animated.View style={nameAnimatedStyle}>
        <Text style={headerStyles.name}>{profile.name}</Text>
        <View style={headerStyles.identityRow}>
          <Text style={headerStyles.identity} numberOfLines={1}>
            {emailLine}
          </Text>
          <View style={headerStyles.verifiedBadge}>
            <Check size={10} color="#FFFFFF" strokeWidth={3} />
            <Text style={headerStyles.verifiedText}>{t('app:profile.verified')}</Text>
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

function createStyles(topInset: number) {
  return StyleSheet.create({
    gradient: {
      paddingTop: topInset + 8,
      paddingHorizontal: 20,
      paddingBottom: 66,
      alignItems: 'center',
      overflow: 'hidden',
    },
    decorGold: {
      position: 'absolute',
      top: -60,
      right: -40,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(194,154,78,0.24)',
    },
    decorSage: {
      position: 'absolute',
      bottom: -40,
      left: -40,
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: 'rgba(95,138,123,0.2)',
    },
    sparkA: { position: 'absolute', top: 64, left: 44, zIndex: 2 },
    sparkB: { position: 'absolute', top: 110, right: 52, zIndex: 2 },
    sparkC: { position: 'absolute', top: 150, left: 70, zIndex: 2 },
    sparkD: { position: 'absolute', top: 90, right: 100, zIndex: 2 },
    topbar: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 3,
    },
    topbarSpacer: { width: 40, height: 40 },
    screenTitle: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: '#FFFFFF',
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
    avatarStage: {
      marginTop: 14,
      width: 120,
      height: 132,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 3,
    },
    halo: {
      position: 'absolute',
      borderRadius: 999,
      borderWidth: 1.5,
    },
    haloInner: {
      width: 108,
      height: 108,
      borderColor: 'rgba(226,201,127,0.5)',
    },
    haloOuter: {
      width: 120,
      height: 120,
      borderColor: 'rgba(226,201,127,0.25)',
    },
    ring: { position: 'absolute', top: 10 },
    avatarPressable: { position: 'absolute', top: 16, zIndex: 2 },
    levelBadge: {
      position: 'absolute',
      bottom: 0,
      borderRadius: 99,
      paddingHorizontal: 10,
      paddingVertical: 3,
      shadowColor: PROFILE.gold,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.55,
      shadowRadius: 8,
      elevation: 4,
    },
    levelBadgeText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.4,
      color: '#2A2110',
    },
    name: {
      marginTop: 16,
      fontSize: 21,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: '#FFFFFF',
      zIndex: 3,
      textAlign: 'center',
    },
    identityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 3,
      zIndex: 3,
      maxWidth: '100%',
      paddingHorizontal: 8,
      justifyContent: 'center',
    },
    identity: {
      fontSize: 12.5,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.72)',
      flexShrink: 1,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: 'rgba(95,138,123,0.9)',
      borderRadius: 99,
      paddingHorizontal: 7,
      paddingVertical: 2,
      flexShrink: 0,
    },
    verifiedText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  });
}
