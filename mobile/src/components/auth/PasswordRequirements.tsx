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

  return (
    <View style={styles.root} accessibilityRole="text">
      <Text style={styles.title}>{t('passwordRules.title')}</Text>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View key={rule.id} style={styles.row}>
            <View style={[styles.dot, met && styles.dotMet]}>
              {met ? <Check size={10} color="#FFFFFF" strokeWidth={3} /> : null}
            </View>
            <Text style={[styles.label, met && styles.labelMet]}>{t(rule.labelKey)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      gap: 6,
      marginTop: 4,
      marginBottom: 8,
      padding: 12,
      borderRadius: 14,
      backgroundColor: AUTH_UI.bg,
      borderWidth: 1,
      borderColor: AUTH_UI.border,
    },
    title: {
      fontSize: 11,
      fontWeight: '700',
      color: AUTH_UI.muted,
      marginBottom: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: AUTH_UI.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    dotMet: {
      borderColor: AUTH_UI.sage,
      backgroundColor: AUTH_UI.sage,
    },
    label: {
      fontSize: 12,
      color: AUTH_UI.muted,
      flex: 1,
    },
    labelMet: {
      color: AUTH_UI.sageDeep,
      fontWeight: '600',
    },
  });
}
