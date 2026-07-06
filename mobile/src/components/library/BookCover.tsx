import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from '../Text';
import { platformShadow } from '../../utils/platformShadow';
import { COVER_GRADIENT, type CoverVariant, LIBRARY_UI } from './libraryTheme';

type CoverSize = 'sm' | 'md' | 'lg';

type BookCoverProps = {
  title: string;
  variant: CoverVariant;
  watermarkIcon?: LucideIcon;
  size?: CoverSize;
  showBrand?: boolean;
};

const SIZE_MAP: Record<CoverSize, { width: number; height: number; titleSize: number; brandSize: number }> = {
  sm: { width: 60, height: 84, titleSize: 9.5, brandSize: 0 },
  md: { width: 92, height: 130, titleSize: 12, brandSize: 8.5 },
  lg: { width: 114, height: 158, titleSize: 13, brandSize: 8.5 },
};

export function BookCover({
  title,
  variant,
  watermarkIcon: WatermarkIcon,
  size = 'md',
  showBrand = true,
}: BookCoverProps) {
  const dims = SIZE_MAP[size];
  const colors = COVER_GRADIENT[variant];
  const styles = useMemo(() => createStyles(dims), [dims]);

  return (
    <View style={[styles.wrap, { width: dims.width, height: dims.height }]}>
      <LinearGradient colors={[...colors]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.gradient}>
        <View style={styles.spine} />
        <View style={styles.shine} />
        {WatermarkIcon ? (
          <View style={styles.watermark}>
            <WatermarkIcon size={dims.width * 0.68} color="#FFFFFF" strokeWidth={1.4} />
          </View>
        ) : null}
        <Text style={styles.title} numberOfLines={4}>
          {title}
        </Text>
        {showBrand && dims.brandSize > 0 ? (
          <Text style={styles.brand}>SOPAAN</Text>
        ) : null}
      </LinearGradient>
    </View>
  );
}

function createStyles(dims: (typeof SIZE_MAP)[CoverSize]) {
  return StyleSheet.create({
    wrap: {
      borderRadius: 11,
      overflow: 'hidden',
      ...platformShadow({ color: LIBRARY_UI.navy, offsetY: 12, opacity: 0.35, radius: 16, elevation: 3 }),
    },
    gradient: {
      flex: 1,
      position: 'relative',
    },
    spine: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 7,
      backgroundColor: 'rgba(0,0,0,0.16)',
    },
    shine: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '60%',
      height: '100%',
      backgroundColor: 'rgba(255,255,255,0.12)',
      transform: [{ skewX: '-12deg' }],
    },
    watermark: {
      position: 'absolute',
      right: -14,
      bottom: -14,
      opacity: 0.16,
    },
    title: {
      position: 'absolute',
      left: 12,
      right: 10,
      top: 14,
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: dims.titleSize,
      lineHeight: dims.titleSize * 1.25,
      letterSpacing: -0.2,
    },
    brand: {
      position: 'absolute',
      left: 12,
      bottom: 11,
      color: 'rgba(255,255,255,0.72)',
      fontSize: dims.brandSize,
      fontWeight: '800',
      letterSpacing: 1,
    },
  });
}
