import { Megaphone } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { HomeBanner } from '../../api/banners';
import { HOME_UI } from './homeTheme';

type HomeTopBannerProps = {
  banner: HomeBanner;
  onPress: (deeplink: string) => void;
};

export function HomeTopBanner({ banner, onPress }: HomeTopBannerProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={banner.message}
      onPress={() => onPress(banner.deeplink)}
      style={({ pressed }) => [styles.root, pressed ? styles.pressed : null]}
      testID="home-top-banner"
    >
      <View style={styles.iconWrap}>
        <Megaphone size={18} color={HOME_UI.gold} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.message} numberOfLines={2}>
          {banner.message}
        </Text>
        <Text style={styles.hint}>Tap to open</Text>
      </View>
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E8D7A8',
      backgroundColor: '#FFF8E8',
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pressed: {
      opacity: 0.92,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: HOME_UI.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      color: HOME_UI.ink,
    },
    hint: {
      fontSize: 12,
      color: HOME_UI.muted,
    },
  });
}
