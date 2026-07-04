import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AffairsList } from './AffairsList';
import { AINudgeCard } from './AINudgeCard';
import { ContinueRow } from './ContinueRow';
import { DailyChallengeCard } from './DailyChallengeCard';
import { HomeFeaturesHub } from './HomeFeaturesHub';
import { HomeAnimatedSection } from './HomeAnimatedSection';
import { HomeSection } from './HomeSection';
import { HomeSectionHeader } from './HomeSectionHeader';
import { LeagueSnapshot } from './LeagueSnapshot';
import { RecommendedRow } from './RecommendedRow';
import {
  HOME_SECTION_META,
  visibleHomeSections,
  type HomeSectionKey,
} from './homeSectionConfig';
import type { HomeFeatureLink } from '../../navigation/homeFeatureConfig';
import type { AppTabParamList, MainStackParamList } from '../../navigation/types';
import type { HomeFeed } from '../../types/home';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type HomeFeedContentProps = {
  feed: HomeFeed;
  navigation: HomeNav;
  onDeeplink: (url: string) => void;
  onDeeplinkWithHaptic: (url: string) => void;
  onTestPress: (testId: string) => void;
  onAffairPress: (affairId: string) => void;
  onLeaguePress: () => void;
  onFeaturePress: (link: HomeFeatureLink) => void;
};

export function HomeFeedContent({
  feed,
  navigation,
  onDeeplink,
  onDeeplinkWithHaptic,
  onTestPress,
  onAffairPress,
  onLeaguePress,
  onFeaturePress,
}: HomeFeedContentProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);
  const sections = useMemo(() => visibleHomeSections(feed), [feed]);

  const sectionAction = useCallback(
    (key: HomeSectionKey) => {
      switch (key) {
        case 'continue':
        case 'recommended':
          return () => navigation.navigate('Practice');
        case 'affairs':
          return () => navigation.navigate('CurrentAffairs');
        default:
          return undefined;
      }
    },
    [navigation],
  );

  const renderSectionBody = useCallback(
    (key: HomeSectionKey) => {
      switch (key) {
        case 'nudges': {
          const [primaryNudge, ...extraNudges] = feed.aiNudges;
          if (!primaryNudge) return null;
          return (
            <View style={styles.nudgesStack}>
              <View testID={`home-section-nudge-${primaryNudge.id}`}>
                <AINudgeCard nudge={primaryNudge} onPress={onDeeplinkWithHaptic} />
              </View>
              {extraNudges.map((nudge) => (
                <View key={nudge.id} style={styles.extraNudge} testID={`home-section-nudge-${nudge.id}`}>
                  <AINudgeCard nudge={nudge} onPress={onDeeplinkWithHaptic} showForYouHeader={false} />
                </View>
              ))}
            </View>
          );
        }
        case 'features':
          return (
            <HomeFeaturesHub
              quickActions={feed.quickActions}
              onFeaturePress={onFeaturePress}
              onShortcutPress={onDeeplinkWithHaptic}
            />
          );
        case 'dailyChallenge':
          return feed.dailyChallenge ? (
            <DailyChallengeCard challenge={feed.dailyChallenge} onPress={onDeeplink} />
          ) : null;
        case 'continue':
          return <ContinueRow items={feed.continue} onItemPress={onDeeplink} />;
        case 'recommended':
          return <RecommendedRow tests={feed.recommendedTests} onTestPress={onTestPress} />;
        case 'affairs':
          return <AffairsList items={feed.currentAffairs} onItemPress={onAffairPress} />;
        case 'league':
          return feed.league ? <LeagueSnapshot league={feed.league} onPress={onLeaguePress} /> : null;
        default:
          return null;
      }
    },
    [
      feed,
      onAffairPress,
      onDeeplink,
      onDeeplinkWithHaptic,
      onFeaturePress,
      onLeaguePress,
      onTestPress,
      styles.extraNudge,
      styles.nudgesStack,
    ],
  );

  return (
    <>
      {sections.map((key, index) => {
        const meta = HOME_SECTION_META[key];
        const isFirst = index === 0;
        const title = meta.titleKey ? t(`home.${meta.titleKey}`) : undefined;
        const actionLabel = meta.actionKey ? t(`home.${meta.actionKey}`) : undefined;
        const onAction = sectionAction(key);

        return (
          <HomeAnimatedSection key={key} index={index}>
            <HomeSection
              testID={meta.testId}
              overlapHero={meta.overlapHero && isFirst}
              isFirst={isFirst}
              padded={meta.padded}
            >
              {title ? (
                <HomeSectionHeader
                  title={title}
                  actionLabel={actionLabel}
                  onActionPress={onAction}
                  compact={isFirst && meta.compactWhenFirst}
                />
              ) : null}
              {renderSectionBody(key)}
            </HomeSection>
          </HomeAnimatedSection>
        );
      })}
    </>
  );
}

function createStyles() {
  return StyleSheet.create({
    nudgesStack: {
      gap: 10,
    },
    extraNudge: {
      marginTop: 4,
    },
  });
}
