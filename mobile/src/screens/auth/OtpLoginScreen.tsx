import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthBrandHeader, AuthScreen, ComingSoonNotice, GhostButton } from '../../components/auth';
import { Text } from '../../components/Text';
import { AUTH_UI } from '../../components/auth/authTheme';
import type { AuthStackParamList } from '../../navigation/types';

type OtpLoginNav = NativeStackNavigationProp<AuthStackParamList, 'OtpLogin'>;

export function OtpLoginScreen() {
  const navigation = useNavigation<OtpLoginNav>();
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(), []);

  return (
    <AuthScreen
      header={
        <AuthBrandHeader title={t('otp.title')} subtitle={t('beta.phoneOtpBody')} />
      }
      footer={
        <GhostButton
          label={t('beta.backToEmailLogin')}
          onPress={() => navigation.navigate('Login')}
        />
      }
    >
      <ComingSoonNotice
        title={t('beta.comingSoonTitle')}
        body={t('beta.phoneOtpBody')}
      />
      <Text style={styles.hint}>{t('beta.betaSignupHint')}</Text>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    hint: {
      fontSize: 13,
      lineHeight: 20,
      color: AUTH_UI.muted,
      textAlign: 'center',
      marginTop: 8,
    },
  });
}
