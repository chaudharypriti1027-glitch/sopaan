import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Camera } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AUTH_UI,
  AuthAnimatedSection,
  AuthBrandHeader,
  AuthPremiumField,
  AuthProgressDots,
  AuthScreen,
  AuthStepLabel,
  GhostButton,
  PrimaryButton,
  useShakeOnError,
} from '../components/auth';
import { Avatar, ChipSelect } from '../components';
import { ConfettiBurst } from '../components/profileSetup/ConfettiBurst';
import { Text } from '../components/Text';
import { meApi, parseApiError } from '../api';
import { useOnboarding } from '../auth/OnboardingContext';
import { routeAfterSession } from '../auth/routeAfterSession';
import { useLanguage } from '../language/LanguageContext';
import type {
  EducationLevel,
  ProfileCategory,
  ProfileLanguage,
} from '../types/auth';
import type { AuthStackParamList, RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/auth';
import { useTheme } from '../theme';
import { pickImageAsset } from '../utils/imagePicker';
import {
  EDUCATION_LEVEL_OPTIONS,
  INDIAN_STATES_ALL,
  LANGUAGE_OPTIONS,
  PROFILE_CATEGORY_OPTIONS,
  PROFILE_SETUP_STEPS,
  TARGET_EXAM_OPTIONS,
} from './profileSetup/constants';
import { useFormat } from '../i18n/useFormat';

type ProfileSetupNav = CompositeNavigationProp<
  NativeStackNavigationProp<AuthStackParamList, 'ProfileSetup'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const STEP_COUNT = PROFILE_SETUP_STEPS.length;
const CONFETTI_HOLD_MS = 900;

function parseExamDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatExamDateLabel(
  date: Date | null,
  optionalLabel: string,
  formatDate: (value: Date, options?: Intl.DateTimeFormatOptions) => string,
) {
  if (!date) {
    return optionalLabel;
  }

  return formatDate(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function toExamDatePayload(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function ProfileSetupScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const navigation = useNavigation<ProfileSetupNav>();
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);
  const { completeOnboarding } = useOnboarding();
  const { setLanguage: setAppLanguage } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [step, setStep] = useState(0);
  const [targetExam, setTargetExam] = useState(profile?.targetExam ?? '');
  const [examDate, setExamDate] = useState<Date | null>(() => parseExamDate(profile?.examDate));
  const [state, setState] = useState(profile?.state ?? '');
  const [stateQuery, setStateQuery] = useState('');
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const [category, setCategory] = useState<ProfileCategory | ''>(profile?.category ?? '');
  const [educationLevel, setEducationLevel] = useState<EducationLevel | ''>(
    profile?.educationLevel ?? '',
  );
  const [language, setLanguage] = useState<ProfileLanguage>(profile?.language ?? 'en');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(profile?.avatarUrl);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const shakeStyle = useShakeOnError(formError);

  const filteredStates = useMemo(() => {
    const query = stateQuery.trim().toLowerCase();
    if (!query) {
      return [...INDIAN_STATES_ALL];
    }

    return INDIAN_STATES_ALL.filter((item) => item.toLowerCase().includes(query));
  }, [stateQuery]);

  const stepCanContinue =
    step === 0
      ? Boolean(targetExam.trim())
      : step === 1
        ? Boolean(state.trim())
        : Boolean(language);

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selected) {
      setExamDate(selected);
      setFormError(null);
    }
  };

  const handlePickAvatar = async () => {
    setFormError(null);
    const asset = await pickImageAsset('library');

    if (!asset) {
      return;
    }

    setAvatarUri(asset.uri);
    setAvatarLoading(true);

    try {
      const updated = await meApi.uploadAvatar({
        uri: asset.uri,
        name: asset.fileName,
        type: asset.mimeType,
      });
      await setProfile(updated);
      setAvatarUri(updated.avatarUrl ?? asset.uri);
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setAvatarLoading(false);
    }
  };

  const persistStep = async (): Promise<boolean> => {
    setFormError(null);
    setLoading(true);

    try {
      if (step === 0) {
        const updated = await meApi.updateMe({
          targetExam: targetExam.trim(),
          examDate: toExamDatePayload(examDate),
        });
        await setProfile(updated);
        return true;
      }

      if (step === 1) {
        const updated = await meApi.updateMe({
          state: state.trim(),
          ...(category ? { category } : {}),
          ...(educationLevel ? { educationLevel } : {}),
        });
        await setProfile(updated);
        return true;
      }

      await setAppLanguage(language);
      const updated = await meApi.updateMe({ language });
      await setProfile(updated);
      await completeOnboarding();
      setShowConfetti(true);
      await wait(CONFETTI_HOLD_MS);
      routeAfterSession(navigation, updated);
      return true;
    } catch (err) {
      setFormError(parseApiError(err).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePrimary = async () => {
    if (!stepCanContinue || loading) {
      if (step === 0 && !targetExam.trim()) {
        setFormError(t('auth:profileSetup.pickExamError'));
      } else if (step === 1 && !state.trim()) {
        setFormError(t('auth:profileSetup.selectStateError'));
      }
      return;
    }

    const saved = await persistStep();
    if (!saved) {
      return;
    }

    if (step < STEP_COUNT - 1) {
      setStep((current) => current + 1);
    }
  };

  const handleBack = () => {
    setFormError(null);
    if (step === 0) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
      return;
    }

    setStep((current) => current - 1);
  };

  const stepMeta = useMemo(() => {
    switch (step) {
      case 0:
        return {
          title: t('auth:profileSetup.stepGoalTitle'),
          subtitle: t('auth:profileSetup.stepGoalSubtitle'),
        };
      case 1:
        return {
          title: t('auth:profileSetup.stepAboutTitle'),
          subtitle: t('auth:profileSetup.stepAboutSubtitle'),
        };
      default:
        return {
          title: t('auth:profileSetup.stepLanguageTitle'),
          subtitle: t('auth:profileSetup.stepLanguageSubtitle'),
        };
    }
  }, [step, t]);

  return (
    <View style={styles.root}>
      <ConfettiBurst active={showConfetti} />
      <AuthScreen
        header={
          <>
            <AuthProgressDots total={STEP_COUNT} current={step} />
            <AuthBrandHeader title={stepMeta.title} subtitle={stepMeta.subtitle} />
          </>
        }
        footer={
          <View style={styles.footer}>
            {step > 0 ? (
              <GhostButton label={t('common:back')} onPress={handleBack} disabled={loading} testID="profile-setup-back" />
            ) : null}
            <PrimaryButton
              label={step === STEP_COUNT - 1 ? t('auth:profileSetup.finish') : t('common:next')}
              loading={loading}
              disabled={!stepCanContinue || loading || showConfetti}
              onPress={handlePrimary}
              testID={step === STEP_COUNT - 1 ? 'profile-setup-finish' : 'profile-setup-next'}
            />
          </View>
        }
      >
        <Animated.View style={shakeStyle} key={`step-${step}`} entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)}>
          {step === 0 ? (
            <GoalStep
              examDate={examDate}
              formError={formError}
              onClearDate={() => setExamDate(null)}
              onExamSelect={setTargetExam}
              onOpenDatePicker={() => setShowDatePicker(true)}
              showDatePicker={showDatePicker}
              styles={styles}
              targetExam={targetExam}
              theme={theme}
              onDateChange={handleDateChange}
            />
          ) : null}

          {step === 1 ? (
            <YouStep
              avatarLoading={avatarLoading}
              avatarUri={avatarUri}
              category={category}
              educationLevel={educationLevel}
              filteredStates={filteredStates}
              formError={formError}
              name={profile?.name}
              onCategorySelect={setCategory}
              onEducationSelect={setEducationLevel}
              onPickAvatar={handlePickAvatar}
              onStateQueryChange={setStateQuery}
              onStateSelect={(value) => {
                setState(value);
                setStateQuery('');
                setStatePickerOpen(false);
                setFormError(null);
              }}
              setStatePickerOpen={setStatePickerOpen}
              state={state}
              statePickerOpen={statePickerOpen}
              stateQuery={stateQuery}
              styles={styles}
              theme={theme}
            />
          ) : null}

          {step === 2 ? (
            <LanguageStep
              formError={formError}
              language={language}
              onLanguageSelect={setLanguage}
              styles={styles}
              theme={theme}
            />
          ) : null}
        </Animated.View>
      </AuthScreen>
    </View>
  );
}

type StepStyles = ReturnType<typeof createStyles>;
type StepTheme = ReturnType<typeof useTheme>['theme'];

type GoalStepProps = {
  targetExam: string;
  examDate: Date | null;
  showDatePicker: boolean;
  formError: string | null;
  styles: StepStyles;
  theme: StepTheme;
  onExamSelect: (value: string) => void;
  onOpenDatePicker: () => void;
  onClearDate: () => void;
  onDateChange: (event: DateTimePickerEvent, selected?: Date) => void;
};

function GoalStep({
  targetExam,
  examDate,
  showDatePicker,
  formError,
  styles,
  theme,
  onExamSelect,
  onOpenDatePicker,
  onClearDate,
  onDateChange,
}: GoalStepProps) {
  const { t } = useTranslation(['auth', 'common']);
  const { formatDate } = useFormat();

  return (
    <View style={styles.stepBody}>
      <AuthAnimatedSection index={0}>
        <AuthStepLabel>{t('auth:profileSetup.targetExamLabel')}</AuthStepLabel>
        <View style={styles.chipRow}>
          {TARGET_EXAM_OPTIONS.map((option) => (
            <ChipSelect
              key={option.value}
              label={option.label}
              emoji={option.emoji}
              selected={targetExam === option.value}
              onPress={() => onExamSelect(option.value)}
              testID={`exam-chip-${option.label.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </View>
      </AuthAnimatedSection>

      <AuthAnimatedSection index={1}>
        <AuthStepLabel>{t('auth:profileSetup.examDateLabel')}</AuthStepLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('auth:profileSetup.pickExamDateA11y')}
          onPress={onOpenDatePicker}
          style={({ pressed }) => [styles.dateCard, pressed && styles.cardPressed]}
          testID="profile-setup-exam-date"
        >
          <Text variant="bodyMedium">
            {formatExamDateLabel(examDate, t('auth:profileSetup.addTargetDateOptional'), formatDate)}
          </Text>
          {examDate ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('auth:profileSetup.clearExamDateA11y')}
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation();
                onClearDate();
              }}
            >
              <Text variant="caption" color="link">
                {t('auth:profileSetup.clearDate')}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>

        {showDatePicker ? (
          <DateTimePicker
            value={examDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        ) : null}
      </AuthAnimatedSection>

      {formError ? (
        <Text variant="caption" style={styles.formError}>
          {formError}
        </Text>
      ) : null}
    </View>
  );
}

type YouStepProps = {
  name?: string;
  avatarUri?: string;
  avatarLoading: boolean;
  state: string;
  stateQuery: string;
  statePickerOpen: boolean;
  filteredStates: string[];
  category: ProfileCategory | '';
  educationLevel: EducationLevel | '';
  formError: string | null;
  styles: StepStyles;
  theme: StepTheme;
  onPickAvatar: () => void;
  onStateQueryChange: (value: string) => void;
  onStateSelect: (value: string) => void;
  setStatePickerOpen: (open: boolean) => void;
  onCategorySelect: (value: ProfileCategory) => void;
  onEducationSelect: (value: EducationLevel) => void;
};

function YouStep({
  name,
  avatarUri,
  avatarLoading,
  state,
  stateQuery,
  statePickerOpen,
  filteredStates,
  category,
  educationLevel,
  formError,
  styles,
  theme,
  onPickAvatar,
  onStateQueryChange,
  onStateSelect,
  setStatePickerOpen,
  onCategorySelect,
  onEducationSelect,
}: YouStepProps) {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <View style={styles.stepBody}>
      <AuthAnimatedSection index={0}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('auth:profileSetup.addPhotoA11y')}
          onPress={onPickAvatar}
          disabled={avatarLoading}
          style={({ pressed }) => [styles.avatarWrap, pressed && styles.cardPressed]}
          testID="profile-setup-avatar"
        >
          <Avatar name={name} source={avatarUri ? { uri: avatarUri } : undefined} size="lg" />
          <View style={styles.avatarBadge}>
            <Camera size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.avatarHint}>
            {avatarLoading ? t('auth:profileSetup.uploading') : t('auth:profileSetup.addPhotoOptional')}
          </Text>
        </Pressable>
      </AuthAnimatedSection>

      <AuthAnimatedSection index={1}>
        <AuthStepLabel>{t('auth:profileSetup.state')}</AuthStepLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('auth:profileSetup.selectStateTitle')}
          onPress={() => setStatePickerOpen(true)}
          style={({ pressed }) => [styles.selectorCard, pressed && styles.cardPressed]}
          testID="profile-setup-state"
        >
          <Text variant="bodyMedium">{state || t('auth:profileSetup.searchSelectState')}</Text>
        </Pressable>
      </AuthAnimatedSection>

      <AuthAnimatedSection index={2}>
        <AuthStepLabel>{t('auth:profileSetup.category')}</AuthStepLabel>
        <View style={styles.chipRow}>
          {PROFILE_CATEGORY_OPTIONS.map((option) => (
            <ChipSelect
              key={option}
              label={option}
              selected={category === option}
              onPress={() => onCategorySelect(option)}
              testID={`category-chip-${option.toLowerCase()}`}
            />
          ))}
        </View>
      </AuthAnimatedSection>

      <AuthAnimatedSection index={3}>
        <AuthStepLabel>{t('auth:profileSetup.education')}</AuthStepLabel>
        <View style={styles.chipRow}>
          {EDUCATION_LEVEL_OPTIONS.map((option) => (
            <ChipSelect
              key={option.value}
              label={option.label}
              selected={educationLevel === option.value}
              onPress={() => onEducationSelect(option.value)}
              testID={`education-chip-${option.value}`}
            />
          ))}
        </View>
      </AuthAnimatedSection>

      {formError ? (
        <Text variant="caption" style={styles.formError}>
          {formError}
        </Text>
      ) : null}

      <Modal
        visible={statePickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setStatePickerOpen(false)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text variant="h3">{t('auth:profileSetup.selectStateTitle')}</Text>
            <Pressable accessibilityRole="button" onPress={() => setStatePickerOpen(false)}>
              <Text variant="bodyMedium" color="link">
                {t('common:ok')}
              </Text>
            </Pressable>
          </View>
          <AuthPremiumField
            label={t('auth:profileSetup.searchState')}
            value={stateQuery}
            onChangeText={onStateQueryChange}
            autoCapitalize="words"
            testID="profile-setup-state-search"
          />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.stateList}>
            {filteredStates.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: state === item }}
                onPress={() => onStateSelect(item)}
                style={({ pressed }) => [
                  styles.stateRow,
                  state === item && styles.stateRowSelected,
                  pressed && styles.cardPressed,
                ]}
                testID={`state-row-${item.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Text variant="bodyMedium">{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

type LanguageStepProps = {
  language: ProfileLanguage;
  formError: string | null;
  styles: StepStyles;
  theme: StepTheme;
  onLanguageSelect: (value: ProfileLanguage) => void;
};

function LanguageStep({ language, formError, styles, onLanguageSelect }: LanguageStepProps) {
  return (
    <View style={styles.stepBody}>
      {LANGUAGE_OPTIONS.map((option, index) => (
        <AuthAnimatedSection key={option.id} index={index}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: language === option.id }}
            onPress={() => onLanguageSelect(option.id)}
            style={({ pressed }) => [
              styles.languageCard,
              language === option.id && styles.languageCardSelected,
              pressed && styles.cardPressed,
            ]}
            testID={`language-card-${option.id}`}
          >
            <Text variant="h3">{option.title}</Text>
            <Text variant="body" color="secondary">
              {option.subtitle}
            </Text>
          </Pressable>
        </AuthAnimatedSection>
      ))}

      {formError ? (
        <Text variant="caption" style={styles.formError}>
          {formError}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    footer: {
      gap: 10,
    },
    stepBody: {
      gap: 20,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    dateCard: {
      minHeight: theme.a11y.minTouchTarget,
      borderRadius: AUTH_UI.inputRadius,
      borderWidth: 1.5,
      borderColor: AUTH_UI.border,
      backgroundColor: AUTH_UI.card,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectorCard: {
      minHeight: theme.a11y.minTouchTarget,
      borderRadius: AUTH_UI.inputRadius,
      borderWidth: 1.5,
      borderColor: AUTH_UI.border,
      backgroundColor: AUTH_UI.card,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    cardPressed: {
      opacity: 0.92,
    },
    avatarWrap: {
      alignSelf: 'center',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    avatarBadge: {
      position: 'absolute',
      top: 44,
      right: -4,
      width: 28,
      height: 28,
      borderRadius: 999,
      backgroundColor: AUTH_UI.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: AUTH_UI.card,
    },
    avatarHint: {
      textAlign: 'center',
      fontSize: 12,
      color: AUTH_UI.muted,
    },
    languageCard: {
      borderRadius: AUTH_UI.inputRadius,
      borderWidth: 1.5,
      borderColor: AUTH_UI.border,
      backgroundColor: AUTH_UI.card,
      padding: 20,
      gap: 4,
      minHeight: 96,
      justifyContent: 'center',
    },
    languageCardSelected: {
      borderColor: AUTH_UI.accent,
      backgroundColor: 'rgba(35,42,77,0.06)',
    },
    formError: {
      fontSize: 12,
      color: '#C4634F',
      textAlign: 'center',
    },
    modalRoot: {
      flex: 1,
      backgroundColor: AUTH_UI.bg,
      paddingTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stateList: {
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing['3xl'],
    },
    stateRow: {
      minHeight: theme.a11y.minTouchTarget,
      borderRadius: AUTH_UI.inputRadius,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: AUTH_UI.card,
      borderWidth: 1,
      borderColor: AUTH_UI.border,
    },
    stateRowSelected: {
      borderColor: AUTH_UI.accent,
      backgroundColor: 'rgba(35,42,77,0.06)',
    },
  });
}
