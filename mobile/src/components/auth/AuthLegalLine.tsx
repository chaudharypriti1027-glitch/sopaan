import { useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../config/externalLinks';
import { Text } from '../Text';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

type AuthLegalLineProps = {
  testID?: string;
};

/** “By continuing you agree to our Terms & Privacy Policy” on the navy canvas. */
export function AuthLegalLine({ testID }: AuthLegalLineProps) {
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap} testID={testID}>
      <Text style={styles.text}>
        {t('login.termsPrefix')}{' '}
        <Text
          style={styles.link}
          onPress={() => void Linking.openURL(TERMS_OF_SERVICE_URL)}
          accessibilityRole="link"
        >
          {t('login.termsLink')}
        </Text>
        {' '}
        {t('signup.consentAnd')}{' '}
        <Text
          style={styles.link}
          onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
          accessibilityRole="link"
        >
          {t('signup.consentPrivacyLink')}
        </Text>
      </Text>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      marginTop: 14,
      paddingHorizontal: 8,
    },
    text: {
      fontFamily: AUTH_FONTS.regular,
      fontSize: 11,
      lineHeight: 16,
      color: AUTH_UI.onCanvasDim,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    link: {
      fontFamily: AUTH_FONTS.medium,
      color: 'rgba(212,175,55,0.72)',
    },
  });
}
