import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PASSWORD_RULES } from '../../lib/passwordPolicy';
import { Text } from '../Text';
import { AUTH_UI } from './authTheme';

type PasswordRequirementsProps = {
  password: string;
};

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(), []);

  if (!password) {
    return null;
  }

  const metCount = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const allMet = metCount === PASSWORD_RULES.length;

  return (
    <View style={styles.root} accessibilityRole="text">
      {!allMet ? (
        <View style={styles.grid}>
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <View key={rule.id} style={styles.row}>
                <View style={[styles.dot, met && styles.dotMet]}>
                  {met ? <Check size={9} color="#FFFFFF" strokeWidth={3} /> : null}
                </View>
                <Text style={[styles.label, met && styles.labelMet]} numberOfLines={1}>
                  {t(rule.labelKey)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.successRow}>
          <View style={[styles.dot, styles.dotMet]}>
            <Check size={9} color="#FFFFFF" strokeWidth={3} />
          </View>
          <Text style={styles.labelMet}>{t('passwordRules.allMet')}</Text>
        </View>
      )}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      marginTop: 2,
      marginBottom: 10,
      padding: 10,
      borderRadius: 12,
      backgroundColor: AUTH_UI.bg,
      borderWidth: 1,
      borderColor: AUTH_UI.border,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: 6,
      columnGap: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      width: '47%',
    },
    successRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: AUTH_UI.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      flexShrink: 0,
    },
    dotMet: {
      borderColor: AUTH_UI.sage,
      backgroundColor: AUTH_UI.sage,
    },
    label: {
      fontSize: 11,
      color: AUTH_UI.muted,
      flexShrink: 1,
    },
    labelMet: {
      fontSize: 11,
      color: AUTH_UI.sageDeep,
      fontWeight: '700',
    },
  });
}
