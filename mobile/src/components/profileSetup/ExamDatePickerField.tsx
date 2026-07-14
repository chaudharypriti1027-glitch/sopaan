import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { AUTH_UI } from '../auth/authTheme';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { useFormat } from '../../i18n/useFormat';
import {
  defaultExamDatePickerValue,
  formatExamDateLabel,
  startOfToday,
} from './examDateUtils';

type ExamDatePickerFieldProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  optionalLabel: string;
  testID?: string;
};

export function ExamDatePickerField({
  value,
  onChange,
  optionalLabel,
  testID = 'exam-date-picker',
}: ExamDatePickerFieldProps) {
  const { t } = useTranslation(['auth', 'common']);
  const { theme } = useTheme();
  const { formatDate } = useFormat();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [iosOpen, setIosOpen] = useState(false);
  const [androidOpen, setAndroidOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(() => defaultExamDatePickerValue(value));
  const [pickerSession, setPickerSession] = useState(0);

  const openPicker = () => {
    setDraftDate(defaultExamDatePickerValue(value));
    setPickerSession((current) => current + 1);

    if (Platform.OS === 'ios') {
      setIosOpen(true);
      return;
    }

    setAndroidOpen(true);
  };

  const closeIosPicker = () => {
    setIosOpen(false);
  };

  const confirmIosPicker = () => {
    onChange(draftDate);
    closeIosPicker();
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    setAndroidOpen(false);

    if (event.type === 'dismissed') {
      return;
    }

    if (selected) {
      onChange(selected);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('auth:profileSetup.pickExamDateA11y')}
        onPress={openPicker}
        style={({ pressed }) => [styles.dateCard, pressed && styles.pressed]}
        testID={testID}
      >
        <Text variant="bodyMedium" style={styles.dateLabel} numberOfLines={2}>
          {formatExamDateLabel(value, optionalLabel, formatDate)}
        </Text>
        {value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('auth:profileSetup.clearExamDateA11y')}
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onChange(null);
            }}
            style={styles.clearAction}
          >
            <Text variant="caption" color="link">
              {t('auth:profileSetup.clearDate')}
            </Text>
          </Pressable>
        ) : null}
      </Pressable>

      {Platform.OS === 'android' && androidOpen ? (
        <DateTimePicker
          value={defaultExamDatePickerValue(value)}
          mode="date"
          display="default"
          minimumDate={startOfToday()}
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={iosOpen}
          transparent
          animationType="slide"
          onRequestClose={closeIosPicker}
        >
          <View style={styles.sheetRoot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common:cancel')}
              style={styles.backdrop}
              onPress={closeIosPicker}
            />
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Pressable accessibilityRole="button" onPress={closeIosPicker} hitSlop={8}>
                  <Text variant="bodyMedium" color="link">
                    {t('common:cancel')}
                  </Text>
                </Pressable>
                <Text variant="bodyMedium" style={styles.sheetTitle}>
                  {t('auth:profileSetup.examDateLabel')}
                </Text>
                <Pressable accessibilityRole="button" onPress={confirmIosPicker} hitSlop={8}>
                  <Text variant="bodyMedium" color="link">
                    {t('common:ok')}
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                key={`exam-date-picker-${pickerSession}`}
                value={draftDate}
                mode="date"
                display="spinner"
                minimumDate={startOfToday()}
                onChange={(_event, selected) => {
                  if (selected) {
                    setDraftDate(
                      new Date(
                        selected.getFullYear(),
                        selected.getMonth(),
                        selected.getDate(),
                        12,
                        0,
                        0,
                        0,
                      ),
                    );
                  }
                }}
                style={styles.iosPicker}
                themeVariant="light"
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
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
      gap: 12,
    },
    dateLabel: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
      color: theme.colors.text.primary,
    },
    clearAction: {
      flexShrink: 0,
    },
    pressed: {
      opacity: 0.92,
    },
    sheetRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15, 23, 42, 0.35)',
    },
    sheet: {
      backgroundColor: AUTH_UI.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: theme.spacing.xl,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: AUTH_UI.border,
    },
    sheetTitle: {
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    iosPicker: {
      height: 216,
      alignSelf: 'stretch',
    },
  });
}
