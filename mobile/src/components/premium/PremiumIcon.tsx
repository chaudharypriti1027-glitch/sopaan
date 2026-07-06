import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { platformShadow } from '../../utils/platformShadow';
import {
  PREMIUM_ICON_3D,
  PREMIUM_ICON_SIZES,
  PREMIUM_ICON_TONES,
  premiumIconGlyphColor,
  type PremiumIconProps,
} from './premiumIconTokens';

/**
 * Standalone premium icon tile (tabs, profile, games). Home uses `HomePremiumIcon`.
 * Single-layer 3D bevel when filled/active — no nested inner box.
 */
export function PremiumIcon({
  Icon,
  tone = 'lavender',
  size = 'md',
  active = false,
  filled = false,
  depth,
  surface = 'light',
}: PremiumIconProps) {
  const { theme } = useTheme();
  const dims = PREMIUM_ICON_SIZES[size];
  const palette = PREMIUM_ICON_TONES[tone] ?? PREMIUM_ICON_TONES.lavender;
  const depthPalette = PREMIUM_ICON_3D[tone];
  const showFilled = filled || active;
  const use3d = depth ?? showFilled;
  const styles = useMemo(() => createStyles(dims, use3d, surface), [dims, use3d, surface]);

  if (!showFilled) {
    return (
      <View style={styles.shell}>
        <Icon size={dims.icon} color={theme.colors.tabBar.inactive} strokeWidth={dims.stroke} />
      </View>
    );
  }

  if (!use3d) {
    return (
      <View
        style={[
          styles.tile,
          {
            backgroundColor: palette.bg,
            borderColor: palette.ring,
          },
        ]}
      >
        <Icon
          size={dims.icon}
          color={palette.fg}
          strokeWidth={active ? dims.stroke + 0.1 : dims.stroke}
        />
      </View>
    );
  }

  const gradient =
    surface === 'dark'
      ? ([depthPalette.darkTop, depthPalette.darkMid, depthPalette.darkBottom] as const)
      : ([depthPalette.top, depthPalette.mid, depthPalette.bottom] as const);

  const borderColor = surface === 'dark' ? 'rgba(255,255,255,0.2)' : palette.ring;
  const glyphColor = premiumIconGlyphColor(tone, surface);

  return (
    <View style={styles.plate}>
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
          <Icon
            size={dims.icon}
            color={glyphColor}
            strokeWidth={active ? dims.stroke + 0.1 : dims.stroke}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

function createStyles(
  dims: (typeof PREMIUM_ICON_SIZES)[keyof typeof PREMIUM_ICON_SIZES],
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
    plate: elevated
      ? platformShadow({
          color: surface === 'dark' ? '#000000' : '#232A4D',
          offsetY: surface === 'dark' ? 5 : 4,
          opacity: surface === 'dark' ? 0.28 : 0.12,
          radius: surface === 'dark' ? 8 : 10,
          elevation: surface === 'dark' ? 4 : 3,
        })
      : {},
    tile: {
      width: dims.tile,
      height: dims.tile,
      borderRadius: dims.radius,
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
      backgroundColor: 'rgba(255,255,255,0.4)',
      zIndex: 3,
    },
    glyph: {
      zIndex: 2,
      transform: [{ translateY: -0.5 }],
    },
  });
}
