import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../theme';

type SopaanLogoProps = {
  size?: number;
  style?: ViewStyle;
  /** When false, renders only the gold ladder mark (for dark brand surfaces). */
  showBackground?: boolean;
};

export function SopaanLogo({ size = 88, style, showBackground = true }: SopaanLogoProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(size), [size]);

  return (
    <View style={[styles.container, style]} accessibilityLabel="Sopaan logo">
      <Svg width={size} height={size} viewBox="0 0 88 88">
        <Defs>
          <LinearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.colors.accent.gold} />
            <Stop offset="1" stopColor={theme.colors.accent.goldOn} />
          </LinearGradient>
        </Defs>
        {showBackground ? (
          <Rect x="8" y="8" width="72" height="72" rx="20" fill={theme.colors.brand.primaryMuted} />
        ) : null}
        <Path d="M28 58V30h6v22h8V38h6v14h8V26h6v32H28z" fill="url(#goldGrad)" />
        <Path
          d="M24 58h40"
          stroke={theme.colors.accent.goldOn}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M30 46h28M30 38h28M30 30h20"
          stroke={theme.colors.accent.gold}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.55}
        />
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
