import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../theme';

type SopaanLogoProps = {
  size?: number;
  style?: ViewStyle;
  /** When false, renders only the navy ascending-bars mark with no gold tile (for dark brand surfaces). */
  showBackground?: boolean;
};

/** Brand mark — three ascending bars ("steps") on a gold tile, matching the app icon. */
export function SopaanLogo({ size = 88, style, showBackground = true }: SopaanLogoProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(size), [size]);
  const navyDeep = theme.colors.brand.primaryHover;
  const navy = theme.colors.brand.primary;
  const navyMid = '#2E3766';

  return (
    <View style={[styles.container, style]} accessibilityLabel="Sopaan logo">
      <Svg width={size} height={size} viewBox="0 0 88 88">
        <Defs>
          <LinearGradient id="goldTile" x1="0.1" y1="0" x2="0.9" y2="1">
            <Stop offset="0" stopColor="#E3C97F" />
            <Stop offset="1" stopColor={theme.colors.accent.gold} />
          </LinearGradient>
        </Defs>
        {showBackground ? (
          <Rect x="4" y="4" width="80" height="80" rx="22" fill="url(#goldTile)" />
        ) : null}
        <Rect x="20" y="49" width="14" height="20" rx="4" fill={showBackground ? navyMid : theme.colors.accent.gold} />
        <Rect x="37" y="38" width="14" height="31" rx="4" fill={showBackground ? navy : theme.colors.accent.gold} />
        <Rect x="54" y="24" width="14" height="45" rx="4" fill={showBackground ? navyDeep : theme.colors.accent.gold} />
      </Svg>
    </View>
  );
}

function createStyles(size: number) {
  return StyleSheet.create({
    container: {
      width: size,
      height: size,
      alignSelf: 'center',
    },
  });
}
