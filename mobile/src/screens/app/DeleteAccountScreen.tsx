import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen, SectionTitle, TextField } from '../../components';
import { authApi, privacyApi } from '../../api';
import { useAuth } from '../../auth';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import { getRefreshToken } from '../../lib/secure';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type DeleteNav = NativeStackNavigationProp<MainStackParamList, 'DeleteAccount'>;

export function DeleteAccountScreen() {
  const navigation = useNavigation<DeleteNav>();
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation(['app', 'common', 'auth']);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [deletionToken, setDeletionToken] = useState<string | null>(null);
  const [requiredPhrase, setRequiredPhrase] = useState('DELETE MY ACCOUNT');
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [step, setStep] = useState<'verify' | 'confirm'>('verify');

  const isPhoneOnly = Boolean(user?.phone && !user?.email);

  const handleSendOtp = async () => {
    if (!user?.phone || otpSending) return;
    setOtpSending(true);
    try {
      await authApi.requestOtp({ phone: user.phone });
      Alert.alert(t('auth:otp.otpSentTitle'), t('auth:otp.otpSentBody'));
    } catch (err) {
      Alert.alert(t('app:deleteAccount.startFailed'), getUserFacingMessage(err));
    } finally {
      setOtpSending(false);
    }
  };

  const handleRequest = async () => {
    setLoading(true);
    try {
      const result = await privacyApi.requestAccountDeletion(
        isPhoneOnly && otpCode.trim()
          ? { otpCode: otpCode.trim() }
          : { password },
      );
      setDeletionToken(result.deletionToken);
      setRequiredPhrase(result.confirmPhrase);
      setStep('confirm');
    } catch (err) {
      Alert.alert(t('app:deleteAccount.startFailed'), getUserFacingMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!deletionToken) return;

    setLoading(true);
    try {
      const refreshToken = await getRefreshToken();
      await privacyApi.confirmAccountDeletion({
        deletionToken,
        confirmPhrase: confirmPhrase.trim(),
        refreshToken: refreshToken ?? undefined,
      });
      Alert.alert(t('app:deleteAccount.deletedTitle'), t('app:deleteAccount.deletedBody'), [
        {
          text: t('common:ok'),
          onPress: () => {
            void logout();
          },
        },
      ]);
    } catch (err) {
      Alert.alert(t('app:deleteAccount.deleteFailed'), getUserFacingMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle subtitle={t('app:deleteAccount.subtitle')} />

      <Card style={styles.warningCard}>
        <Trash2 size={20} color={theme.colors.semantic.error} />
        <Text style={styles.warningText}>{t('app:deleteAccount.warningDetail')}</Text>
      </Card>

      {step === 'verify' ? (
        <View style={styles.form}>
          {isPhoneOnly ? (
            <>
              <Text style={styles.hint}>{t('app:deleteAccount.otpHint')}</Text>
              <Button
                label={t('auth:login.sendOtp')}
                variant="ghost"
                loading={otpSending}
                disabled={loading}
                onPress={() => void handleSendOtp()}
                fullWidth
              />
              <TextField
                label={t('app:deleteAccount.otpCode')}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                placeholder={t('app:deleteAccount.otpPlaceholder')}
              />
            </>
          ) : null}
          <TextField
            label={isPhoneOnly ? t('app:deleteAccount.passwordOptional') : t('app:deleteAccount.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button
            label={t('common:continue')}
            loading={loading}
            disabled={!password && otpCode.trim().length !== 6}
            onPress={() => void handleRequest()}
            fullWidth
          />
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.hint}>
            {t('app:deleteAccount.confirmHint', { phrase: requiredPhrase })}
          </Text>
          <TextField
            label={t('app:deleteAccount.confirmPhraseLabel')}
            value={confirmPhrase}
            onChangeText={setConfirmPhrase}
            autoCapitalize="characters"
          />
          <Button
            label={t('app:deleteAccount.deletePermanently')}
            loading={loading}
            disabled={confirmPhrase.trim() !== requiredPhrase}
            onPress={() => void handleConfirm()}
            fullWidth
          />
          <Button label={t('common:cancel')} variant="ghost" onPress={() => navigation.goBack()} fullWidth />
        </View>
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    warningCard: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'flex-start',
      backgroundColor: theme.colors.semantic.errorMuted,
    },
    warningText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
      flex: 1,
    },
    form: { gap: theme.spacing.md },
    hint: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    phrase: {
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.semantic.error,
    },
  });
}
