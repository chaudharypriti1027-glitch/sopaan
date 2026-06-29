import { useMemo } from 'react';
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
import { HomeSectionHeader } from './HomeSectionHeader';
import { LeagueSnapshot } from './LeagueSnapshot';
import { RecommendedRow } from './RecommendedRow';
import { HOME_UI } from './homeTheme';
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

  const primaryNudge = feed.aiNudges[0];
  const extraNudges = feed.aiNudges.slice(1);

  let sectionIndex = 0;

  return (
    <>
      {primaryNudge ? (
        <HomeAnimatedSection index={sectionIndex++}>
          <View style={styles.forYouWrap} testID="home-section-nudges">
            <View testID={`home-section-nudge-${primaryNudge.id}`}>
              <AINudgeCard nudge={primaryNudge} onPress={onDeeplinkWithHaptic} />
            </View>
            {extraNudges.map((nudge) => (
              <View key={nudge.id} style={styles.extraNudge} testID={`home-section-nudge-${nudge.id}`}>
                <AINudgeCard
                  nudge={nudge}
                  onPress={onDeeplinkWithHaptic}
                  showForYouHeader={false}
                />
              </View>
            ))}
          </View>
        </HomeAnimatedSection>
      ) : null}

      <HomeAnimatedSection index={sectionIndex++}>
        <View style={styles.section}>
          <HomeSectionHeader title={t('home.explore')} compact={!primaryNudge} />
          <HomeFeaturesHub
            quickActions={feed.quickActions}
            onFeaturePress={onFeaturePress}
            onShortcutPress={onDeeplinkWithHaptic}
          />
        </View>
      </HomeAnimatedSection>

      {feed.dailyChallenge?.status === 'todo' ? (
        <HomeAnimatedSection index={sectionIndex++}>
          <View style={styles.section} testID="home-section-daily-challenge">
            <HomeSectionHeader title={t('home.dailyChallenge')} />
            <DailyChallengeCard challenge={feed.dailyChallenge} onPress={onDeeplink} />
          </View>
        </HomeAnimatedSection>
      ) : null}

      {feed.continue.length > 0 ? (
        <HomeAnimatedSection index={sectionIndex++}>
          <View style={styles.section} testID="home-section-continue">
            <HomeSectionHeader
              title={t('home.continueLearning')}
              actionLabel={t('home.seeAll')}
              onActionPress={() => navigation.navigate('Practice')}
            />
            <ContinueRow items={feed.continue} onItemPress={onDeeplink} />
          </View>
        </HomeAnimatedSection>
      ) : null}

      {feed.recommendedTests.length > 0 ? (
        <HomeAnimatedSection index={sectionIndex++}>
          <View testID="home-section-recommended">
            <View style={styles.testsHead}>
              <HomeSectionHeader
                title={t('home.recommendedTests')}
                actionLabel={t('home.seeAll')}
                onActionPress={() => navigation.navigate('Practice')}
              />
            </View>
            <RecommendedRow tests={feed.recommendedTests} onTestPress={onTestPress} />
          </View>
        </HomeAnimatedSection>
      ) : null}

      {feed.currentAffairs.length > 0 ? (
        <HomeAnimatedSection index={sectionIndex++}>
          <View style={styles.section} testID="home-section-affairs">
            <HomeSectionHeader
              title={t('home.todaysAffairs')}
              actionLabel={t('home.allAffairs')}
              onActionPress={() => navigation.navigate('CurrentAffairs')}
            />
            <AffairsList items={feed.currentAffairs} onItemPress={onAffairPress} />
          </View>
        </HomeAnimatedSection>
      ) : null}

      {feed.league ? (
        <HomeAnimatedSection index={sectionIndex++}>
          <View style={styles.section} testID="home-section-league">
            <HomeSectionHeader title={t('home.yourLeague')} />
            <LeagueSnapshot league={feed.league} onPress={onLeaguePress} />
          </View>
        </HomeAnimatedSection>
      ) : null}
    </>
  );
}

function createStyles() {
  return StyleSheet.create({
    forYouWrap: {
      marginTop: HOME_UI.forYouLift,
      paddingHorizontal: 16,
      gap: 10,
    },
    extraNudge: {
      marginTop: 4,
    },
    section: {
      paddingHorizontal: 16,
    },
    testsHead: {
      paddingHorizontal: 16,
    },
  });
}
