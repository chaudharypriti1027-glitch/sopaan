import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChipSelect } from '../ChipSelect';
import { Field } from '../auth';
import { Text } from '../Text';
import { INDIAN_STATES_ALL } from '../../screens/profileSetup/constants';
import { useTheme } from '../../theme';

type StateFilterPickerProps = {
  value: string;
  onChange: (state: string) => void;
  profileState?: string;
};

const QUICK_STATES = ['National', 'Uttar Pradesh', 'Maharashtra', 'Bihar', 'Delhi', 'Gujarat', 'Karnataka'];

export function StateFilterPicker({ value, onChange, profileState }: StateFilterPickerProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const quickOptions = useMemo(() => {
    const options = ['National'];
    if (profileState && !options.includes(profileState)) {
      options.push(profileState);
    }
    for (const state of QUICK_STATES) {
      if (!options.includes(state)) {
        options.push(state);
      }
    }
    return options;
  }, [profileState]);

  const filteredStates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = ['National', ...INDIAN_STATES_ALL];
    if (!q) return all;
    return all.filter((item) => item.toLowerCase().includes(q));
  }, [query]);

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {quickOptions.map((state) => (
          <ChipSelect
            key={state}
            label={state === 'National' ? t('currentAffairs.national') : state}
            selected={value === state}
            onPress={() => onChange(state)}
            style={styles.chip}
          />
        ))}
        <ChipSelect
          label={t('currentAffairs.moreStates')}
          selected={!quickOptions.includes(value)}
          onPress={() => setOpen(true)}
          style={styles.chip}
        />
      </ScrollView>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text variant="h3">Select state</Text>
              <Pressable accessibilityRole="button" onPress={() => setOpen(false)}>
                <Text style={styles.close}>Done</Text>
              </Pressable>
            </View>
            <Field label="Search state" value={query} onChangeText={setQuery} />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.stateList}>
              {filteredStates.map((state) => (
                <Pressable
                  key={state}
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(state);
                    setOpen(false);
                    setQuery('');
                  }}
                  style={[styles.stateRow, value === state && styles.stateRowSelected]}
                >
                  <Text style={styles.stateLabel}>{state}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    chips: {
      gap: theme.spacing.sm,
      paddingRight: theme.spacing.lg,
    },
    chip: {
      marginRight: theme.spacing.sm,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      maxHeight: '78%',
      backgroundColor: theme.colors.surface.default,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    close: {
      color: theme.colors.brand.primary,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
    },
    stateList: {
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing.xl,
    },
    stateRow: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: 12,
    },
    stateRowSelected: {
      backgroundColor: theme.colors.brand.primaryMuted,
    },
    stateLabel: {
      fontSize: 15,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
  });
}
