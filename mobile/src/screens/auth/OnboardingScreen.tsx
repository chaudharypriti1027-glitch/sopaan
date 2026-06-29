import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AUTH_UI,
  AuthAnimatedSection,
  AuthBrandHeader,
  AuthProgressDots,
  AuthScreen,
  PrimaryButton,
} from '../../components/auth';
import { ChipSelect } from '../../components';
import { Text } from '../../components/Text';
import { useOnboarding } from '../../auth/OnboardingContext';
import { useExperiments } from '../../experiments';
import { EXAM_CATEGORIES, type ExamCategoryId } from '../../auth/onboardingData';
import type { AuthStackParamList } from '../../navigation/types';

type OnboardingNav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNav>();
  const { examCategory, setExamCategory } = useOnboarding();
  const { payloads } = useExperiments();
  const copy = payloads.onboarding_variant;
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(), []);
  const [selected, setSelected] = useState<ExamCategoryId | null>(examCategory);

  const handleContinue = () => {
    if (!selected) return;
    setExamCategory(selected);
    navigation.navigate('GoalSetup');
  };

  return (
    <AuthScreen
      header={
        <>
          <AuthProgressDots total={3} current={0} />
          <AuthBrandHeader title={copy.title} subtitle={copy.subtitle} badge={copy.eyebrow} />
        </>
      }
      footer={
        <PrimaryButton
          label={t('onboarding.continue')}
          testID="onboarding-continue"
          disabled={!selected}
          onPress={handleContinue}
        />
      }
    >
      <View style={styles.body}>
        <AuthAnimatedSection index={0}>
          <View style={styles.chipGrid}>
            {EXAM_CATEGORIES.map((exam) => (
              <ChipSelect
                key={exam.id}
                label={exam.label}
                emoji={exam.emoji}
                selected={selected === exam.id}
                onPress={() => setSelected(exam.id)}
                style={styles.chip}
              />
            ))}
          </View>
        </AuthAnimatedSection>
        <Text style={styles.hint}>{copy.hint || t('onboarding.hint')}</Text>
      </View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    body: {
      gap: 16,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      marginBottom: 4,
    },
    hint: {
      fontSize: 12,
      color: AUTH_UI.faint,
      lineHeight: 18,
    },
  });
}
