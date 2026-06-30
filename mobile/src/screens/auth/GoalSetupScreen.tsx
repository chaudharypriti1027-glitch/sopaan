import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Briefcase,
  Building2,
  GraduationCap,
  Landmark,
  Shield,
  Train,
  Trophy,
  Users,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AUTH_UI,
  AuthAnimatedSection,
  AuthBrandHeader,
  AuthProgressDots,
  AuthScreen,
  AuthStepLabel,
  GhostButton,
  PrimaryButton,
} from '../../components/auth';
import { ChipSelect, GoalCard } from '../../components';
import { useAuth } from '../../auth';
import { useOnboarding } from '../../auth/OnboardingContext';
import {
  CAREER_GOALS,
  getTargetYearOptions,
  type CareerGoal,
} from '../../auth/onboardingData';
import { parseApiError } from '../../api';
import type { AuthStackParamList } from '../../navigation/types';

type GoalNav = NativeStackNavigationProp<AuthStackParamList, 'GoalSetup'>;

function GoalIcon({ goalId, color }: { goalId: string; color: string }) {
  const size = 22;
  switch (goalId) {
    case 'ias':
      return <Landmark size={size} color={color} />;
    case 'bank-po':
      return <Building2 size={size} color={color} />;
    case 'ssc-officer':
      return <Briefcase size={size} color={color} />;
    case 'railway':
      return <Train size={size} color={color} />;
    case 'police':
      return <Shield size={size} color={color} />;
    case 'defence':
      return <Trophy size={size} color={color} />;
    case 'state-psc':
      return <Users size={size} color={color} />;
    case 'teacher':
      return <GraduationCap size={size} color={color} />;
    case 'other-govt-job':
      return <Briefcase size={size} color={color} />;
    default:
      return <Briefcase size={size} color={color} />;
  }
}

export function GoalSetupScreen() {
  const navigation = useNavigation<GoalNav>();
  const { isAuthenticated } = useAuth();
  const { examCategory, goal, setGoal, saveGoalToServer } = useOnboarding();
  const { t } = useTranslation(['auth', 'common']);
  const styles = useMemo(() => createStyles(), []);

  const filteredGoals = CAREER_GOALS.filter(
    (item) => !examCategory || item.categories.includes(examCategory),
  );

  const [selectedGoal, setSelectedGoal] = useState<CareerGoal | null>(
    goal
      ? (CAREER_GOALS.find((g) => g.id === goal.careerId) ??
          CAREER_GOALS.find((g) => g.examTrack === goal.examTrack) ??
          null)
      : null,
  );
  const yearOptions = getTargetYearOptions();
  const [targetYear, setTargetYear] = useState(goal?.targetYear ?? yearOptions[1]);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedGoal) return;

    const payload = {
      careerId: selectedGoal.id,
      careerLabel: selectedGoal.title,
      examTrack: selectedGoal.examTrack,
      targetYear,
    };

    setLoading(true);
    try {
      if (isAuthenticated) {
        await saveGoalToServer(payload);
      } else {
        setGoal(payload);
      }
      navigation.navigate('ProfileSetup');
    } catch (error) {
      Alert.alert(t('auth:goalSetup.saveFailed'), parseApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      header={
        <>
          <AuthProgressDots total={3} current={1} />
          <AuthBrandHeader
            title={t('auth:goalSetup.title')}
            subtitle={t('auth:goalSetup.subtitle')}
            badge={t('auth:goalSetup.eyebrow')}
          />
        </>
      }
      footer={
        <View style={styles.footer}>
          <GhostButton label={t('common:back', { defaultValue: 'Back' })} onPress={() => navigation.goBack()} disabled={loading} />
          <PrimaryButton
            label={t('common:continue')}
            testID="goal-setup-continue"
            loading={loading}
            disabled={!selectedGoal}
            onPress={handleContinue}
          />
        </View>
      }
    >
      <View style={styles.body}>
        <AuthAnimatedSection index={0}>
          <View style={styles.grid}>
            {filteredGoals.map((item) => (
              <GoalCard
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                selected={selectedGoal?.id === item.id}
                icon={
                  <GoalIcon
                    goalId={item.id}
                    color={selectedGoal?.id === item.id ? AUTH_UI.accent : AUTH_UI.muted}
                  />
                }
                onPress={() => setSelectedGoal(item)}
                style={styles.goalCard}
              />
            ))}
          </View>
        </AuthAnimatedSection>

        <AuthAnimatedSection index={1}>
          <AuthStepLabel>{t('auth:goalSetup.targetYear')}</AuthStepLabel>
          <View style={styles.yearRow}>
            {yearOptions.map((year) => (
              <ChipSelect
                key={year}
                label={String(year)}
                selected={targetYear === year}
                onPress={() => setTargetYear(year)}
              />
            ))}
          </View>
        </AuthAnimatedSection>
      </View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    body: {
      gap: 20,
    },
    footer: {
      gap: 10,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    goalCard: {
      maxWidth: '48%',
    },
    yearRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
  });
}
