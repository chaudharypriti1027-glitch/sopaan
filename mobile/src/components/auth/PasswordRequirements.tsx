import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PASSWORD_RULES } from '../../lib/passwordPolicy';
import { Text } from '../Text';
import { AUTH_UI } from './authTheme';

type PasswordRequirementsProps = {
  password: string;
  /** Glass checklist on the navy canvas. */
  dark?: boolean;
};

export function PasswordRequirements({ password, dark = false }: PasswordRequirementsProps) {
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(dark), [dark]);

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

function createStyles(dark: boolean) {
  return StyleSheet.create({
    root: {
      marginTop: dark ? 10 : 2,
      marginBottom: 10,
      padding: 10,
      borderRadius: 12,
      backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(28,36,80,0.04)',
      borderWidth: 1,
      borderColor: dark ? 'rgba(240,212,136,0.16)' : 'rgba(28,36,80,0.1)',
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
      borderColor: dark ? 'rgba(240,212,136,0.3)' : AUTH_UI.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: dark ? 'transparent' : '#FFFFFF',
      flexShrink: 0,
    },
    dotMet: {
      borderColor: AUTH_UI.sage,
      backgroundColor: AUTH_UI.sage,
    },
    label: {
      fontSize: 11,
      color: dark ? 'rgba(228,216,190,0.55)' : AUTH_UI.muted,
      flexShrink: 1,
    },
    labelMet: {
      fontSize: 11,
      color: dark ? '#7FC29B' : AUTH_UI.sageDeep,
      fontWeight: '700',
    },
  });
}
