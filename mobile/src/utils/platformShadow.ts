import { Platform, type ViewStyle } from 'react-native';

type ShadowSpec = {
  color: string;
  offsetY: number;
  opacity: number;
  radius: number;
  elevation?: number;
};

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return `rgba(28,30,46,${alpha})`;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Native shadow* props on iOS/Android; boxShadow on web (avoids deprecation warnings). */
export function platformShadow(spec: ShadowSpec): ViewStyle {
  if (Platform.OS === 'web') {
    const rgba = spec.color.startsWith('#')
      ? hexToRgba(spec.color, spec.opacity)
      : spec.color;
    return {
      boxShadow: `0 ${spec.offsetY}px ${spec.radius}px ${rgba}`,
    } as ViewStyle;
  }

  return {
    shadowColor: spec.color,
    shadowOffset: { width: 0, height: spec.offsetY },
    shadowOpacity: spec.opacity,
    shadowRadius: spec.radius,
    elevation: spec.elevation ?? 4,
  };
}
