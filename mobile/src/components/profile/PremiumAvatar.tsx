import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';
import { OptimizedImage } from '../OptimizedImage';
import { Text } from '../Text';
import { platformShadow } from '../../utils/platformShadow';
import type { AvatarPreset } from './avatarPresets';
import { LiveAvatarMotion } from './LiveAvatarMotion';
import { PersonAvatarArt } from './PersonAvatarArt';
import { PROFILE } from './profileTheme';

export type PremiumAvatarSize = 'sm' | 'md' | 'hero' | 'lg' | 'xl';

type PremiumAvatarProps = {
  name?: string;
  photoUri?: string;
  preset?: AvatarPreset;
  size?: PremiumAvatarSize;
  /** Gold gradient ring + 3D bevel — profile header or home hero. */
  variant?: 'default' | 'profile' | 'hero';
  /** Blinking eyes, breathe, shimmer — on for profile/hero by default. */
  live?: boolean;
  showEditBadge?: boolean;
  loading?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SIZE_MAP: Record<
  PremiumAvatarSize,
  { tile: number; radius: number; icon: number; ring: number; ringPad: number; depth: number }
> = {
  sm: { tile: 32, radius: 11, icon: 16, ring: 0, ringPad: 0, depth: 3 },
  md: { tile: 44, radius: 14, icon: 22, ring: 0, ringPad: 0, depth: 4 },
  hero: { tile: 52, radius: 16, icon: 0, ring: 58, ringPad: 3, depth: 6 },
  lg: { tile: 64, radius: 20, icon: 30, ring: 0, ringPad: 0, depth: 5 },
  xl: { tile: 82, radius: 24, icon: 38, ring: 88, ringPad: 3, depth: 6 },
};

function getInitials(name?: string) {
  if (!name?.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function PresetTile({
  preset,
  dims,
  styles,
  live,
}: {
  preset: AvatarPreset;
  dims: (typeof SIZE_MAP)[PremiumAvatarSize];
  styles: ReturnType<typeof createStyles>;
  live: boolean;
}) {
  if (preset.kind === 'person' && preset.person) {
    return (
      <LinearGradient
        colors={[...preset.gradient]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.tile, { borderColor: preset.ring }]}
      >
        <View style={styles.sceneGlow} />
        <View style={styles.sheen} />
        <View style={styles.edgeLight} />
        <View style={styles.cornerGlint} />
        <View style={styles.rim} />
        <View style={styles.personStage}>
          <PersonAvatarArt
            spec={preset.person}
            scene={preset.gradient}
            size={dims.tile}
            live={live}
          />
        </View>
        <View style={styles.innerFrame} pointerEvents="none" />
      </LinearGradient>
    );
  }

  const Icon = preset.Icon;
  if (!Icon) return null;

  return (
    <LinearGradient
      colors={[...preset.gradient]}
      start={{ x: 0.18, y: 0 }}
      end={{ x: 0.82, y: 1 }}
      style={[styles.tile, { borderColor: preset.ring }]}
    >
      <View style={styles.sheen} />
      <View style={styles.edgeLight} />
      <View style={styles.cornerGlint} />
      <View style={styles.rim} />
      <View style={styles.glyphLift}>
        <Icon size={dims.icon} color={preset.glyph} strokeWidth={2.2} />
      </View>
      <View style={styles.innerFrame} pointerEvents="none" />
    </LinearGradient>
  );
}

export function PremiumAvatar({
  name,
  photoUri,
  preset,
  size = 'md',
  variant = 'default',
  live,
  showEditBadge = false,
  loading = false,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: PremiumAvatarProps) {
  const dims = SIZE_MAP[size];
  const isProfile = variant === 'profile' && size === 'xl';
  const isHero = variant === 'hero' && size === 'hero';
  const ringed = isProfile || isHero;
  const isLive = live ?? ringed;
  const elevated = Boolean(preset) || Boolean(photoUri);
  const styles = useMemo(
    () => createStyles(dims, ringed, isProfile, isHero, elevated),
    [dims, ringed, isProfile, isHero, elevated],
  );

  const inner = photoUri ? (
    <View style={styles.photoPlate}>
      <OptimizedImage uri={photoUri} style={styles.photo} accessibilityLabel={name} />
      <View style={styles.photoSheen} pointerEvents="none" />
      <View style={styles.photoDepth} pointerEvents="none" />
      <View style={styles.innerFrame} pointerEvents="none" />
    </View>
  ) : preset ? (
    <View style={styles.depthPlate}>
      <PresetTile preset={preset} dims={dims} styles={styles} live={isLive} />
    </View>
  ) : (
    <View style={styles.depthPlate}>
      <LinearGradient
        colors={[PROFILE.goldLt, PROFILE.gold, '#A67C33']}
        start={{ x: 0.18, y: 0 }}
        end={{ x: 0.82, y: 1 }}
        style={[styles.tile, { borderColor: PROFILE.goldLt }]}
      >
        <View style={styles.sheen} />
        <View style={styles.edgeLight} />
        <View style={styles.cornerGlint} />
        <Text style={styles.initials}>{getInitials(name)}</Text>
      </LinearGradient>
    </View>
  );

  const avatarContent = (
    <LiveAvatarMotion live={isLive} shimmer={ringed}>
      {inner}
    </LiveAvatarMotion>
  );

  const body = (
    <View style={[styles.wrap, style]} testID={testID}>
      {ringed ? (
        <LinearGradient
          colors={
            isHero
              ? (['#F8E4B4', '#E3C97F', '#C29A4E', '#8F6B28'] as const)
              : (['#F8E4B4', PROFILE.goldLt, PROFILE.gold, '#A67C33'] as const)
          }
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.profileRing, isHero && styles.heroRing]}
        >
          <View style={styles.ringSheen} />
          <View style={styles.ringGlow} />
          {avatarContent}
        </LinearGradient>
      ) : (
        avatarContent
      )}
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#FFFFFF" size="small" />
        </View>
      ) : null}
      {showEditBadge ? (
        <View style={styles.cameraBadge}>
          <LinearGradient
            colors={['#FFFFFF', '#F6F3EB']}
            style={styles.cameraBadgeFill}
          >
            <Camera size={size === 'xl' ? 14 : 12} color={PROFILE.navy} strokeWidth={1.75} />
          </LinearGradient>
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return body;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

function createStyles(
  dims: (typeof SIZE_MAP)[PremiumAvatarSize],
  ringed: boolean,
  isProfile: boolean,
  isHero: boolean,
  elevated: boolean,
) {
  const tileSize = dims.tile;
  const ringRadius = Math.round(dims.ring * 0.31);

  return StyleSheet.create({
    wrap: {
      width: ringed ? dims.ring : tileSize,
      height: ringed ? dims.ring : tileSize,
      alignItems: 'center',
      justifyContent: 'center',
      ...(ringed
        ? platformShadow({
            color: isHero ? '#000000' : PROFILE.navy,
            offsetY: isHero ? 8 : 10,
            opacity: isHero ? 0.32 : 0.32,
            radius: isHero ? 14 : 16,
            elevation: 6,
          })
        : elevated
          ? platformShadow({
              color: PROFILE.navy,
              offsetY: dims.depth,
              opacity: 0.18,
              radius: 10,
              elevation: 4,
            })
          : null),
    },
    profileRing: {
      width: dims.ring,
      height: dims.ring,
      borderRadius: ringRadius,
      padding: dims.ringPad,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    heroRing: {
      borderColor: 'rgba(255,255,255,0.28)',
    },
    ringSheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '40%',
      backgroundColor: 'rgba(255,255,255,0.22)',
      zIndex: 1,
    },
    ringGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: ringRadius,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      zIndex: 0,
    },
    depthPlate: {
      borderRadius: dims.radius,
      ...platformShadow({
        color: '#000000',
        offsetY: 2,
        opacity: 0.12,
        radius: 4,
        elevation: 2,
      }),
    },
    tile: {
      width: tileSize,
      height: tileSize,
      borderRadius: dims.radius,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      overflow: 'hidden',
    },
    sceneGlow: {
      position: 'absolute',
      top: -8,
      right: -8,
      width: tileSize * 0.55,
      height: tileSize * 0.55,
      borderRadius: tileSize * 0.28,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    personStage: {
      zIndex: 2,
      transform: [{ translateY: 1 }],
    },
    photoPlate: {
      width: tileSize,
      height: tileSize,
      borderRadius: dims.radius,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    photoSheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '42%',
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    photoDepth: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '28%',
      backgroundColor: 'rgba(0,0,0,0.12)',
    },
    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '50%',
      backgroundColor: 'rgba(255,255,255,0.28)',
      zIndex: 1,
    },
    edgeLight: {
      position: 'absolute',
      top: 2,
      left: 2,
      bottom: 2,
      width: 1.5,
      backgroundColor: 'rgba(255,255,255,0.38)',
      zIndex: 3,
    },
    cornerGlint: {
      position: 'absolute',
      top: 3,
      right: 4,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.42)',
      zIndex: 3,
    },
    rim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 3,
      backgroundColor: 'rgba(0,0,0,0.14)',
      zIndex: 3,
    },
    innerFrame: {
      position: 'absolute',
      top: 1,
      left: 1,
      right: 1,
      bottom: 1,
      borderRadius: dims.radius - 1,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      zIndex: 4,
    },
    glyphLift: {
      zIndex: 2,
      transform: [{ translateY: -1 }],
    },
    initials: {
      fontSize: Math.round(tileSize * 0.34),
      fontWeight: '800',
      color: '#2A2110',
      zIndex: 2,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: dims.radius,
      backgroundColor: 'rgba(35,42,77,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 6,
    },
    cameraBadge: {
      position: 'absolute',
      bottom: isProfile ? -2 : -3,
      right: isProfile ? -2 : -3,
      width: isProfile ? 30 : 26,
      height: isProfile ? 30 : 26,
      borderRadius: isProfile ? 15 : 13,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: PROFILE.navy,
      zIndex: 7,
      ...platformShadow({
        color: PROFILE.navy,
        offsetY: 3,
        opacity: 0.25,
        radius: 5,
        elevation: 3,
      }),
    },
    cameraBadgeFill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.94,
      transform: [{ scale: 0.98 }],
    },
  });
}
