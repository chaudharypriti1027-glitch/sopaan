import { useMemo, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GLASS, GLASS_WEB_WASH, type GlassTone } from './glassTokens';

const isWeb = Platform.OS === 'web';

type GlassSurfaceProps = {
  children?: ReactNode;
  /** Which frosted-glass skin to apply — light glass over light bg, dark glass over gradients/imagery. */
  tone?: GlassTone;
  /** expo-blur intensity, 0-100. */
  intensity?: number;
  borderRadius?: number;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Reusable frosted-glass ("glassmorphism") surface — blur + tint wash + hairline edge. */
export function GlassSurface({
  children,
  tone = 'light',
  intensity = 44,
  borderRadius = 20,
  bordered = true,
  style,
  testID,
}: GlassSurfaceProps) {
  const preset = GLASS[tone];
  const wash = isWeb ? GLASS_WEB_WASH[tone] : preset.wash;
  const styles = useMemo(
    () => createStyles(borderRadius, preset.border, bordered),
    [borderRadius, preset.border, bordered],
  );

  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.backdrop} pointerEvents="none">
        {!isWeb ? (
          <BlurView intensity={intensity} tint={preset.blurTint} style={StyleSheet.absoluteFillObject} />
        ) : null}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: wash }]} />
      </View>
      {children ? <View style={[styles.content, style]}>{children}</View> : null}
    </View>
  );
}

function createStyles(borderRadius: number, borderColor: string, bordered: boolean) {
  return StyleSheet.create({
    wrap: {
      borderRadius,
      overflow: 'hidden',
      borderWidth: bordered ? 1 : 0,
      borderColor,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      position: 'relative',
      zIndex: 1,
    },
  });
}
