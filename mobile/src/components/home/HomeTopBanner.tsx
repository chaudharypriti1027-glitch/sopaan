import { Megaphone, ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HomeFeedCard } from './HomeFeedCard';
import { Text } from '../Text';
import type { HomeBanner } from '../../api/banners';
import { HOME_UI } from './homeTheme';

type HomeTopBannerProps = {
  banner: HomeBanner;
  onPress: (deeplink: string) => void;
};

export function HomeTopBanner({ banner, onPress }: HomeTopBannerProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <HomeFeedCard
        onPress={() => onPress(banner.deeplink)}
        accentTop
        tint={HOME_UI.goldSoft}
        style={styles.card}
        contentStyle={styles.body}
        testID="home-top-banner"
      >
        <View style={styles.leadIcon}>
          <Megaphone size={15} color={HOME_UI.goldDeep} strokeWidth={2.2} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.message} numberOfLines={2}>
            {banner.message}
          </Text>
          <Text style={styles.hint}>{t('home.topBannerTap')}</Text>
        </View>
        <ChevronRight size={16} color={HOME_UI.goldDeep} strokeWidth={2.4} />
      </HomeFeedCard>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      marginHorizontal: HOME_UI.horizontalPad,
      marginTop: 8,
      marginBottom: 4,
    },
    card: {
      borderColor: HOME_UI.goldBorder,
    },
    body: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    leadIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: HOME_UI.goldSoft,
      borderWidth: 1,
      borderColor: HOME_UI.goldBorder,
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    message: {
      fontSize: 13.5,
      lineHeight: 18,
      fontWeight: '700',
      color: HOME_UI.ink,
    },
    hint: {
      fontSize: 11,
      fontWeight: '600',
      color: HOME_UI.goldDeep,
    },
  });
}
