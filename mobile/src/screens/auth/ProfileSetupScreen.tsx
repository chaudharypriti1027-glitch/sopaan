import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, ChipSelect, Eyebrow } from '../../components';
import { useAuth } from '../../auth';
import { useOnboarding } from '../../auth/OnboardingContext';
import {
  ATTEMPT_OPTIONS,
  EDUCATION_OPTIONS,
  INDIAN_STATES,
  PROFILE_CATEGORIES,
  type ProfileCategory,
} from '../../auth/onboardingData';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import type { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { AuthScreenLayout } from './AuthScreenLayout';

type ProfileNav = NativeStackNavigationProp<AuthStackParamList, 'ProfileSetup'>;

export function ProfileSetupScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { isAuthenticated } = useAuth();
  const { profile, setProfile, saveProfileToServer, goal } = useOnboarding();
  const { theme } = useTheme();
  const { t } = useTranslation(['auth', 'common']);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [education, setEducation] = useState(profile?.education ?? '');
  const [category, setCategory] = useState<ProfileCategory | null>(
    (profile?.category as ProfileCategory | undefined) ?? null,
  );
  const [state, setState] = useState(profile?.state ?? '');
  const [attemptNumber, setAttemptNumber] = useState<number | null>(profile?.attemptNumber ?? 1);
  const [targetYear, setTargetYear] = useState<number | null>(
    profile?.targetYear ?? goal?.targetYear ?? null,
  );
  const [loading, setLoading] = useState(false);

  const canContinue = Boolean(education && category && state && attemptNumber && targetYear);

  const handleContinue = async () => {
    if (!canContinue || !category || !attemptNumber || !targetYear) return;

    const payload = {
      education,
      category,
      state,
      attemptNumber,
      targetYear,
    };

    setLoading(true);
    try {
      if (isAuthenticated) {
        await saveProfileToServer(payload);
      } else {
        setProfile(payload);
      }
      navigation.navigate('Signup');
    } catch (error) {
      Alert.alert(t('auth:profileSetup.saveFailed'), getUserFacingMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      showBack
      title={t('auth:profileSetup.title')}
      subtitle={t('auth:profileSetup.subtitle')}
      footer={
        <Button
          label={t('common:continue')}
          testID="profile-setup-continue"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!canContinue}
          onPress={handleContinue}
        />
      }
    >
      <Eyebrow>{t('auth:profileSetup.eyebrow')}</Eyebrow>

      <View style={styles.section}>
        <Text style={styles.label}>{t('auth:profileSetup.education')}</Text>
        <View style={styles.chipRow}>
          {EDUCATION_OPTIONS.map((option) => (
            <ChipSelect
              key={option}
              label={option}
              selected={education === option}
              onPress={() => setEducation(option)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('auth:profileSetup.category')}</Text>
        <View style={styles.chipRow}>
          {PROFILE_CATEGORIES.map((option) => (
            <ChipSelect
              key={option}
              label={option}
              selected={category === option}
              onPress={() => setCategory(option)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('auth:profileSetup.state')}</Text>
        <View style={styles.chipRow}>
          {INDIAN_STATES.map((option) => (
            <ChipSelect
              key={option}
              label={option}
              selected={state === option}
              onPress={() => setState(option)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('auth:profileSetup.attemptNumber')}</Text>
        <View style={styles.chipRow}>
          {ATTEMPT_OPTIONS.map((option) => (
            <ChipSelect
              key={option}
              label={option === 4 ? t('auth:profileSetup.attemptPlus') : String(option)}
              selected={attemptNumber === option}
              onPress={() => setAttemptNumber(option)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('auth:profileSetup.targetYear')}</Text>
        <View style={styles.chipRow}>
          {[new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2].map(
            (year) => (
              <ChipSelect
                key={year}
                label={String(year)}
                selected={targetYear === year}
                onPress={() => setTargetYear(year)}
              />
            ),
          )}
        </View>
      </View>
    </AuthScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    section: {
      gap: theme.spacing.sm,
    },
    label: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });
}
