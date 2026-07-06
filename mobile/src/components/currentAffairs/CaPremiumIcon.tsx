import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import {
  PREMIUM_ICON_3D,
  PREMIUM_ICON_SIZES,
  PREMIUM_ICON_TONES,
  premiumIconGlyphColor,
  type PremiumIconSize,
  type PremiumIconTone,
} from '../premium/premiumIconTokens';
import { platformShadow } from '../../utils/platformShadow';
import { CA_UI } from './caTheme';

type CaPremiumIconProps = {
  Icon: LucideIcon;
  tone?: PremiumIconTone;
  size?: PremiumIconSize;
  style?: StyleProp<ViewStyle>;
};

/** Single-layer 3D icon tile for CA stats and banners. */
export function CaPremiumIcon({
  Icon,
  tone = 'lavender',
  size = 'sm',
  style,
}: CaPremiumIconProps) {
  const palette = PREMIUM_ICON_TONES[tone];
  const depth = PREMIUM_ICON_3D[tone];
  const dims = PREMIUM_ICON_SIZES[size];
  const styles = useMemo(() => createStyles(dims), [dims]);

  return (
    <View style={[styles.plate, style]}>
      <LinearGradient
        colors={[depth.top, depth.mid, depth.bottom]}
        start={{ x: 0.18, y: 0 }}
        end={{ x: 0.82, y: 1 }}
        style={[
          styles.tile,
          {
            width: dims.tile,
            height: dims.tile,
            borderRadius: dims.radius,
            borderColor: palette.ring,
          },
        ]}
      >
        <View style={styles.sheen} />
        <View style={styles.edgeLight} />
        <View style={styles.cornerGlint} />
        <View style={styles.rim} />
        <Icon size={dims.icon} color={premiumIconGlyphColor(tone, 'light')} strokeWidth={dims.stroke} />
      </LinearGradient>
    </View>
  );
}

function createStyles(dims: (typeof PREMIUM_ICON_SIZES)[PremiumIconSize]) {
  return StyleSheet.create({
    plate: {
      ...platformShadow({
        color: CA_UI.shadow,
        offsetY: 4,
        opacity: 0.14,
        radius: 8,
        elevation: 3,
      }),
    },
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
    cornerGlint: {
      position: 'absolute',
      top: 3,
      right: 4,
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.4)',
    },
    rim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
  });
}
