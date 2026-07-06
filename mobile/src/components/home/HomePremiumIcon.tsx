import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { Flame } from 'lucide-react-native';
import { NumText } from '../NumText';
import {
  PREMIUM_ICON_3D,
  PREMIUM_ICON_SIZES,
  PREMIUM_ICON_TONES,
  premiumIconGlyphColor,
  type PremiumIconSize,
  type PremiumIconTone,
} from '../premium/premiumIconTokens';
import { platformShadow } from '../../utils/platformShadow';
import { HOME_UI } from './homeTheme';
import { HOME_ICON_SLOTS, type HomeIconSlot } from './homeIcons';

type HomePremiumIconProps = {
  Icon: LucideIcon;
  tone?: PremiumIconTone;
  size?: PremiumIconSize;
  filled?: boolean;
  elevated?: boolean;
  surface?: 'light' | 'dark';
  style?: ViewStyle | ViewStyle[];
};

/**
 * Single-layer 3D icon tile — one bevel shell with glyph (no nested inner box).
 * Prefer `HomeIcon` / `HomeSlotIcon` in home screens.
 */
export function HomePremiumIcon({
  Icon,
  tone = 'lavender',
  size = 'md',
  filled = true,
  elevated = true,
  surface = 'light',
  style,
}: HomePremiumIconProps) {
  const palette = PREMIUM_ICON_TONES[tone];
  const depth = PREMIUM_ICON_3D[tone];
  const dims = PREMIUM_ICON_SIZES[size];
  const styles = useMemo(
    () => createStyles(dims, elevated, surface),
    [dims, elevated, surface],
  );

  if (!filled) {
    return (
      <View style={[styles.shell, style]}>
        <Icon
          size={dims.icon}
          color={premiumIconGlyphColor(tone, surface)}
          strokeWidth={dims.stroke}
        />
      </View>
    );
  }

  const gradient =
    surface === 'dark'
      ? ([depth.darkTop, depth.darkMid, depth.darkBottom] as const)
      : ([depth.top, depth.mid, depth.bottom] as const);

  const borderColor = surface === 'dark' ? 'rgba(255,255,255,0.2)' : palette.ring;
  const glyphColor = premiumIconGlyphColor(tone, surface);

  return (
    <View style={[styles.plate, elevated && styles.plateShadow, style]}>
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0.18, y: 0 }}
        end={{ x: 0.82, y: 1 }}
        style={[
          styles.tile,
          {
            width: dims.tile,
            height: dims.tile,
            borderRadius: dims.radius,
            borderColor,
          },
        ]}
      >
        <View
          style={[
            styles.sheen,
            { borderTopLeftRadius: dims.radius, borderTopRightRadius: dims.radius },
          ]}
        />
        <View style={styles.edgeLight} />
        <View style={styles.cornerGlint} />
        <View style={styles.rim} />
        <View style={styles.glyph}>
          <Icon size={dims.icon} color={glyphColor} strokeWidth={dims.stroke} />
        </View>
      </LinearGradient>
    </View>
  );
}

/** Unified home icon API — use slot presets from `homeIcons.ts`. */
export function HomeIcon({
  slot,
  Icon,
  tone = 'lavender',
  style,
}: {
  slot: HomeIconSlot;
  Icon: LucideIcon;
  tone?: PremiumIconTone;
  style?: ViewStyle;
}) {
  return <HomeSlotIcon slot={slot} Icon={Icon} tone={tone} style={style} />;
}

/** @alias HomeIcon */
export function HomeSlotIcon({
  slot,
  Icon,
  tone = 'lavender',
  style,
}: {
  slot: HomeIconSlot;
  Icon: LucideIcon;
  tone?: PremiumIconTone;
  style?: ViewStyle;
}) {
  const preset = HOME_ICON_SLOTS[slot];
  return (
    <HomePremiumIcon
      Icon={Icon}
      tone={tone}
      size={preset.size}
      filled={preset.filled}
      elevated={preset.elevated}
      surface={'surface' in preset ? preset.surface : 'light'}
      style={style}
    />
  );
}

export function HomeSectionIcon({
  Icon,
  tone,
  style,
}: {
  Icon: LucideIcon;
  tone: PremiumIconTone;
  style?: ViewStyle;
}) {
  return (
    <HomeIcon
      slot="section"
      Icon={Icon}
      tone={tone}
      style={style ? StyleSheet.flatten([sectionStyles.wrap, style]) : sectionStyles.wrap}
    />
  );
}

export function HeroIcon3D({
  Icon,
  tone = 'gold',
  size = 'sm',
  style,
}: {
  Icon: LucideIcon;
  tone?: PremiumIconTone;
  size?: PremiumIconSize;
  style?: ViewStyle;
}) {
  return (
    <HomePremiumIcon
      Icon={Icon}
      tone={tone}
      size={size}
      filled
      elevated
      surface="dark"
      style={style}
    />
  );
}

export function HomeFlameStatIcon({ value, style }: { value: number; style?: ViewStyle }) {
  const styles = useMemo(() => flameStyles(), []);

  return (
    <View style={[styles.plate, style]}>
      <LinearGradient
        colors={['#F8E4B4', '#C29A4E', '#8A6528']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.tile}
      >
        <View style={styles.sheen} />
        <View style={styles.rim} />
        <Flame size={17} color="#FFFFFF" strokeWidth={2.2} fill="rgba(255,255,255,0.9)" />
        <NumText style={styles.num}>{value}</NumText>
      </LinearGradient>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: { marginTop: 1 },
});

const flameStyles = () =>
  StyleSheet.create({
    plate: {
      ...platformShadow({ color: '#8A6528', offsetY: 5, opacity: 0.4, radius: 9, elevation: 4 }),
    },
    tile: {
      width: 56,
      height: 56,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.26)',
      overflow: 'hidden',
    },
    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '44%',
      backgroundColor: 'rgba(255,255,255,0.26)',
    },
    rim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      backgroundColor: 'rgba(0,0,0,0.14)',
    },
    num: {
      fontSize: 17,
      fontWeight: '800',
      color: '#FFFFFF',
      lineHeight: 19,
    },
  });

function createStyles(
  dims: (typeof PREMIUM_ICON_SIZES)[PremiumIconSize],
  elevated: boolean,
  surface: 'light' | 'dark',
) {
  return StyleSheet.create({
    shell: {
      width: dims.tile,
      height: dims.tile,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plate: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    plateShadow: platformShadow({
      color: surface === 'dark' ? '#000000' : HOME_UI.shadow,
      offsetY: surface === 'dark' ? 5 : 4,
      opacity: surface === 'dark' ? 0.28 : 0.14,
      radius: surface === 'dark' ? 8 : 10,
      elevation: surface === 'dark' ? 4 : 3,
    }),
    tile: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      overflow: 'hidden',
    },
    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '48%',
      backgroundColor: 'rgba(255,255,255,0.28)',
    },
    edgeLight: {
      position: 'absolute',
      top: 2,
      left: 2,
      bottom: 2,
      width: 1,
      backgroundColor: 'rgba(255,255,255,0.35)',
    },
    rim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    cornerGlint: {
      position: 'absolute',
      top: 3,
      right: 4,
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.42)',
      zIndex: 3,
    },
    glyph: {
      zIndex: 2,
      transform: [{ translateY: -0.5 }],
    },
  });
}
