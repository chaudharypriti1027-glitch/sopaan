import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../config/externalLinks';
import { Text } from '../Text';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

type AuthTermsBoxProps = {
  checked: boolean;
  onToggle: () => void;
  policyVersion: string;
  testID?: string;
  /** Gold checkbox on the navy canvas — Sign-in Flow reference. */
  dark?: boolean;
};

export function AuthTermsBox({ checked, onToggle, policyVersion, testID, dark = false }: AuthTermsBoxProps) {
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(dark), [dark]);

  const checkbox = checked ? (
    dark ? (
      <LinearGradient
        colors={['#CE9D2F', '#F5DC96', '#CE9D2F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.checkboxCheckedDark}
      >
        <Check size={12} color={AUTH_UI.accentDark} strokeWidth={3} />
      </LinearGradient>
    ) : (
      <View style={[styles.checkbox, styles.checkboxChecked]}>
        <Check size={11} color="#FFFFFF" strokeWidth={3} />
      </View>
    )
  ) : (
    <View style={styles.checkbox} />
  );

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={t('otp.consentA11y', { version: policyVersion })}
      testID={testID}
      onPress={onToggle}
      style={styles.box}
    >
      {checkbox}
      <Text variant="caption" style={styles.text}>
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

function createStyles(dark: boolean) {
  return StyleSheet.create({
    box: {
      flexDirection: 'row',
      gap: dark ? 11 : 10,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 4,
      paddingHorizontal: 2,
    },
    checkbox: {
      width: dark ? 22 : 20,
      height: dark ? 22 : 20,
      borderRadius: dark ? 7 : 6,
      borderWidth: 1.5,
      borderColor: dark ? 'rgba(240,212,136,0.4)' : 'rgba(28,36,80,0.22)',
      backgroundColor: dark ? 'transparent' : AUTH_UI.cardElevated,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    checkboxChecked: {
      backgroundColor: AUTH_UI.goldMid,
      borderColor: AUTH_UI.goldMid,
    },
    checkboxCheckedDark: {
      width: 22,
      height: 22,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      shadowColor: AUTH_UI.goldMid,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 3,
    },
    text: {
      flex: 1,
      lineHeight: 18,
      color: dark ? 'rgba(228,216,190,0.65)' : AUTH_UI.muted,
    },
    link: {
      color: dark ? AUTH_UI.focus : AUTH_UI.goldDeep,
      fontFamily: AUTH_FONTS.bold,
    },
  });
}
