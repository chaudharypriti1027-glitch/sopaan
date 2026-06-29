import { Image, type ImageContentFit, type ImageProps, type ImageStyle } from 'expo-image';
import { StyleSheet, type StyleProp } from 'react-native';

type OptimizedImageProps = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  accessibilityLabel?: string;
};

const blurhashPlaceholder = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export function OptimizedImage({
  uri,
  style,
  contentFit = 'cover',
  accessibilityLabel,
}: OptimizedImageProps) {
  return (
    <Image
      source={{ uri }}
      style={[styles.image, style]}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={150}
      placeholder={{ blurhash: blurhashPlaceholder }}
      accessibilityLabel={accessibilityLabel}
      recyclingKey={uri}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#E5E7EB',
  },
});

export type { ImageProps };
