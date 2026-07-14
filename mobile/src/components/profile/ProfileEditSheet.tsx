import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChipSelect } from '../ChipSelect';
import { ExamDatePickerField } from '../profileSetup/ExamDatePickerField';
import { parseExamDate, toExamDatePayload } from '../profileSetup/examDateUtils';
import { TargetExamGrid } from '../profileSetup/TargetExamGrid';
import {
  isValidTargetExam,
  resolveTargetExam,
  splitTargetExam,
} from '../../utils/examTarget';
import { Field, PrimaryButton } from '../auth';
import { Text } from '../Text';
import type {
  EducationLevel,
  Profile,
  ProfileCategory,
  ProfileLanguage,
} from '../../types/auth';
import { useTheme } from '../../theme';
import {
  EDUCATION_LEVEL_OPTIONS,
  INDIAN_STATES_ALL,
  LANGUAGE_OPTIONS,
  PROFILE_CATEGORY_OPTIONS,
} from '../../screens/profileSetup/constants';

type ProfileEditSheetProps = {
  visible: boolean;
  profile: Profile;
  loading: boolean;
  onClose: () => void;
  onSave: (input: {
    name: string;
    targetExam: string;
    examDate: string | null;
    state: string;
    category?: ProfileCategory;
    educationLevel?: EducationLevel;
    language: ProfileLanguage;
  }) => Promise<void>;
};

export function ProfileEditSheet({ visible, profile, loading, onClose, onSave }: ProfileEditSheetProps) {
  const { t } = useTranslation(['app', 'common', 'auth']);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const initialExam = splitTargetExam(profile.targetExam);
  const [name, setName] = useState(profile.name);
  const [examSelection, setExamSelection] = useState(initialExam.selection);
  const [customExamName, setCustomExamName] = useState(initialExam.customName);
  const [examDate, setExamDate] = useState<Date | null>(() => parseExamDate(profile.examDate));
  const [state, setState] = useState(profile.state);
  const [stateQuery, setStateQuery] = useState('');
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const [category, setCategory] = useState<ProfileCategory | ''>(profile.category ?? '');
  const [educationLevel, setEducationLevel] = useState<EducationLevel | ''>(
    profile.educationLevel ?? '',
  );
  const [language, setLanguage] = useState<ProfileLanguage>(profile.language);

  const filteredStates = useMemo(() => {
    const query = stateQuery.trim().toLowerCase();
    if (!query) {
      return [...INDIAN_STATES_ALL];
    }

    return INDIAN_STATES_ALL.filter((item) => item.toLowerCase().includes(query));
  }, [stateQuery]);

  const resetForm = () => {
    const split = splitTargetExam(profile.targetExam);
    setName(profile.name);
    setExamSelection(split.selection);
    setCustomExamName(split.customName);
    setExamDate(parseExamDate(profile.examDate));
    setState(profile.state);
    setStateQuery('');
    setCategory(profile.category ?? '');
    setEducationLevel(profile.educationLevel ?? '');
    setLanguage(profile.language);
    setStatePickerOpen(false);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedState = state.trim();
    const trimmedExam = resolveTargetExam(examSelection, customExamName);

    if (!trimmedName || !trimmedState || !isValidTargetExam(examSelection, customExamName)) {
      Alert.alert(t('app:profile.editMissingTitle'), t('app:profile.editMissingBody'));
      return;
    }

    void onSave({
      name: trimmedName,
      targetExam: trimmedExam,
      examDate: toExamDatePayload(examDate),
      state: trimmedState,
      ...(category ? { category } : {}),
      ...(educationLevel ? { educationLevel } : {}),
      language,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={resetForm}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onClose}>
            <Text variant="bodyMedium" color="link">
              {t('common:cancel')}
            </Text>
          </Pressable>
          <Text variant="h3">{t('app:profile.editTitle')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Field
            variant="text"
            label={t('app:profile.editFullName')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            testID="edit-profile-name"
          />

          <Text variant="label" color="secondary">
            {t('app:profile.targetExam')}
          </Text>
          <TargetExamGrid
            selection={examSelection}
            customName={customExamName}
            onSelectionChange={setExamSelection}
            onCustomNameChange={setCustomExamName}
          />

          <Text variant="label" color="secondary">
            {t('auth:profileSetup.examDateLabel')}
          </Text>
          <ExamDatePickerField
            value={examDate}
            onChange={setExamDate}
            optionalLabel={t('app:profile.notSet')}
            testID="edit-profile-exam-date"
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => setStatePickerOpen(true)}
            style={styles.selectorCard}
            testID="edit-profile-state"
          >
            <Text variant="caption" color="secondary">
              {t('app:profile.stateLabel')}
            </Text>
            <Text variant="bodyMedium" color={state ? 'primary' : 'secondary'}>
              {state || t('app:profile.selectState')}
            </Text>
          </Pressable>

          <Text variant="label" color="secondary">
            {t('app:profile.editCategory')}
          </Text>
          <View style={styles.chipRow}>
            {PROFILE_CATEGORY_OPTIONS.map((option) => (
              <ChipSelect
                key={option}
                label={option}
                selected={category === option}
                onPress={() => setCategory(option)}
                style={styles.categoryChip}
              />
            ))}
          </View>

          <Text variant="label" color="secondary">
            {t('app:profile.editEducation')}
          </Text>
          <View style={styles.chipRow}>
            {EDUCATION_LEVEL_OPTIONS.map((option) => (
              <ChipSelect
                key={option.value}
                label={option.label}
                selected={educationLevel === option.value}
                onPress={() => setEducationLevel(option.value)}
                style={styles.categoryChip}
              />
            ))}
          </View>

          <Text variant="label" color="secondary">
            {t('app:profile.languageLabel')}
          </Text>
          <View style={styles.languageRow}>
            {LANGUAGE_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected: language === option.id }}
                onPress={() => setLanguage(option.id)}
                style={[
                  styles.languageCard,
                  language === option.id && styles.languageCardSelected,
                ]}
              >
                <Text variant="bodyMedium">{option.title}</Text>
                <Text variant="caption" color="secondary" style={styles.languageSubtitle}>
                  {option.subtitle}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={t('app:profile.editSave')}
            loading={loading}
            onPress={handleSave}
            testID="edit-profile-save"
          />
        </View>
      </View>

      <Modal
        visible={statePickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setStatePickerOpen(false)}
      >
        <View style={styles.stateModal}>
          <View style={styles.header}>
            <Text variant="h3">{t('app:profile.editSelectStateTitle')}</Text>
            <Pressable accessibilityRole="button" onPress={() => setStatePickerOpen(false)}>
              <Text variant="bodyMedium" color="link">
                {t('common:ok')}
              </Text>
            </Pressable>
          </View>
          <Field
            variant="text"
            label={t('app:profile.editSearchState')}
            value={stateQuery}
            onChangeText={setStateQuery}
            autoCapitalize="words"
          />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.stateList}>
            {filteredStates.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => {
                  setState(item);
                  setStateQuery('');
                  setStatePickerOpen(false);
                }}
                style={[styles.stateRow, state === item && styles.stateRowSelected]}
              >
                <Text variant="bodyMedium">{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
    },
    headerSpacer: {
      width: 48,
    },
    body: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing['3xl'],
      gap: theme.spacing.lg,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    categoryChip: {
      minWidth: '30%',
      flexGrow: 1,
    },
    selectorCard: {
      borderRadius: theme.radii.card,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      backgroundColor: theme.colors.surface.default,
      padding: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    languageRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    languageCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: theme.a11y.minTouchTarget,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      backgroundColor: theme.colors.surface.default,
      padding: theme.spacing.md,
      gap: 2,
    },
    languageSubtitle: {
      textAlign: 'center',
    },
    languageCardSelected: {
      borderColor: theme.colors.brand.primary,
      backgroundColor: theme.colors.brand.primaryMuted,
    },
    footer: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.xl,
    },
    stateModal: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      paddingTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    stateList: {
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing['3xl'],
    },
    stateRow: {
      minHeight: theme.a11y.minTouchTarget,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface.default,
    },
    stateRowSelected: {
      backgroundColor: theme.colors.brand.primaryMuted,
    },
  });
}
