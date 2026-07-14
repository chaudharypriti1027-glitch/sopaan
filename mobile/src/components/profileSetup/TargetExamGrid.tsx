import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AUTH_UI } from '../auth/authTheme';
import { AuthPremiumField } from '../auth/AuthPremiumField';
import { ExamOptionCard } from './ExamOptionCard';
import { TargetExamIcon } from './TargetExamIcon';
import { OTHER_EXAM_VALUE, TARGET_EXAM_OPTIONS } from '../../screens/profileSetup/constants';
import { isOtherExamSelection } from '../../utils/examTarget';

type TargetExamGridProps = {
  selection: string;
  customName: string;
  onSelectionChange: (selection: string) => void;
  onCustomNameChange: (name: string) => void;
  style?: ViewStyle;
};

export function TargetExamGrid({
  selection,
  customName,
  onSelectionChange,
  onCustomNameChange,
  style,
}: TargetExamGridProps) {
  const { t } = useTranslation('auth');

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.grid}>
        {TARGET_EXAM_OPTIONS.map((option) => {
          const selected = selection === option.value;

          return (
            <ExamOptionCard
              key={option.value}
              style={styles.item}
              label={option.label}
              description={option.description}
              selected={selected}
              icon={
                <TargetExamIcon
                  examValue={option.value}
                  color={selected ? AUTH_UI.accent : AUTH_UI.muted}
                />
              }
              onPress={() => {
                onSelectionChange(option.value);
                if (option.value !== OTHER_EXAM_VALUE) {
                  onCustomNameChange('');
                }
              }}
              testID={`exam-chip-${option.label.toLowerCase().replace(/\s+/g, '-')}`}
            />
          );
        })}
      </View>

      {isOtherExamSelection(selection) ? (
        <AuthPremiumField
          label={t('profileSetup.customExamLabel')}
          value={customName}
          onChangeText={onCustomNameChange}
          placeholder={t('profileSetup.customExamPlaceholder')}
          autoCapitalize="characters"
          testID="custom-exam-name"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  item: {
    flexBasis: '47%',
    flexGrow: 1,
    maxWidth: '49%',
    minWidth: 140,
  },
});
