import { Megaphone, ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HomeSlotIcon } from './HomePremiumIcon';
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
        <HomeSlotIcon slot="shortcut" Icon={Megaphone} tone="gold" />
        <View style={styles.copy}>
          <Text style={styles.message} numberOfLines={2}>
            {banner.message}
          </Text>
          <Text style={styles.hint}>{t('home.topBannerTap')}</Text>
        </View>
        <HomeSlotIcon slot="button" Icon={ChevronRight} tone="gold" />
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
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
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
