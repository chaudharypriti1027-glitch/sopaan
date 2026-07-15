import { useMemo, useState } from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type SopaanLogoProps = {
  size?: number;
  style?: ViewStyle;
  /**
   * Kept for API compatibility. The brand mark is a complete framed icon;
   * background is always included in the SVG.
   */
  showBackground?: boolean;
};

/** Solid vector brand mark — never depends on PNG assets / Metrolinks. */
function BrandMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88" accessibilityElementsHidden>
      <Defs>
        <LinearGradient id="sopaanGold" x1="0.12" y1="0" x2="0.88" y2="1">
          <Stop offset="0" stopColor="#E3C97F" />
          <Stop offset="1" stopColor="#C29A4E" />
        </LinearGradient>
      </Defs>
      <Rect x="4" y="4" width="80" height="80" rx="22" fill="url(#sopaanGold)" />
      <Rect x="20" y="49" width="14" height="20" rx="4" fill="#2E3766" />
      <Rect x="37" y="38" width="14" height="31" rx="4" fill="#1C2450" />
      <Rect x="54" y="24" width="14" height="45" rx="4" fill="#131A3C" />
    </Svg>
  );
}

/** Supplied gold “S” brand mark with an offline-safe SVG fallback. */
export function SopaanLogo({ size = 88, style }: SopaanLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const styles = useMemo(() => createStyles(size), [size]);

  return (
    <View style={[styles.container, style]} accessibilityLabel="Sopaan logo">
      {imageFailed ? (
        <BrandMark size={size} />
      ) : (
        <Image
          source={require('../../assets/brand-mark.png')}
          style={styles.image}
          resizeMode="contain"
          onError={() => setImageFailed(true)}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

function createStyles(size: number) {
  return StyleSheet.create({
    container: {
      width: size,
      height: size,
      alignSelf: 'center',
      overflow: 'hidden',
      borderRadius: Math.round(size * 0.25),
    },
    image: {
      width: size,
      height: size,
    },
  });
}
