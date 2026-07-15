import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../config/externalLinks';
import { Text } from '../Text';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

type AuthTermsBoxProps = {
  checked: boolean;
  onToggle: () => void;
  policyVersion: string;
  testID?: string;
};

export function AuthTermsBox({ checked, onToggle, policyVersion, testID }: AuthTermsBoxProps) {
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(), []);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={t('otp.consentA11y', { version: policyVersion })}
      testID={testID}
      onPress={onToggle}
      style={styles.box}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Check size={11} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
      <Text variant="caption" color="secondary" style={styles.text}>
        {t('otp.consentPolicyBefore')}{' '}
        <Text
          variant="label"
          style={styles.link}
          onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
        >
          {t('otp.consentPrivacyLink')}
        </Text>{' '}
        {t('otp.consentAnd')}{' '}
        <Text
          variant="label"
          style={styles.link}
          onPress={() => void Linking.openURL(TERMS_OF_SERVICE_URL)}
        >
          {t('otp.consentTermsLink')}
        </Text>
      </Text>
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    box: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 4,
      paddingHorizontal: 2,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: AUTH_UI.borderHover,
      backgroundColor: AUTH_UI.card,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    checkboxChecked: {
      backgroundColor: AUTH_UI.goldDeep,
      borderColor: AUTH_UI.goldDeep,
    },
    text: {
      flex: 1,
      lineHeight: 18,
    },
    link: {
      color: AUTH_UI.accent,
      fontFamily: AUTH_FONTS.bold,
    },
  });
}
