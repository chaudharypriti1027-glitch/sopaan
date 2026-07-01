import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import {
  PREMIUM_ICON_SIZES,
  PREMIUM_ICON_TONES,
  type PremiumIconProps,
} from './premiumIconTokens';

export function PremiumIcon({
  Icon,
  tone = 'lavender',
  size = 'md',
  active = false,
  filled = false,
}: PremiumIconProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(), []);
  const dims = PREMIUM_ICON_SIZES[size];
  const palette = PREMIUM_ICON_TONES[tone];

  const backgroundColor = active || filled ? palette.bg : 'transparent';
  const iconColor = active || filled ? palette.fg : theme.colors.tabBar.inactive;
  const borderColor = active || filled ? palette.ring : 'transparent';

  return (
    <View
      style={[
        styles.box,
        {
          width: dims.box,
          height: dims.box,
          borderRadius: dims.radius,
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <Icon size={dims.icon} color={iconColor} strokeWidth={active ? dims.stroke + 0.15 : dims.stroke} />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    box: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
  });
}
