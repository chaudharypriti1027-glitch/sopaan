import { KeyRound } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen, SectionTitle, TextField } from '../../components';
import { PasswordRequirements } from '../../components/auth';
import { usePremiumDialog } from '../../components/premium/PremiumDialogProvider';
import { authApi, parseApiError } from '../../api';
import { useAuth } from '../../auth';
import { normalizeAuthResult } from '../../auth/normalizeAuthResult';
import { isStrongPassword } from '../../lib/passwordPolicy';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../theme';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation(['auth', 'common']);
  const { alert } = usePremiumDialog();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasEmail = Boolean(user?.email);
  const canSubmit =
    isStrongPassword(newPassword) && newPassword === confirm && !loading;

  const handleSubmit = async () => {
    setError(null);

    if (!isStrongPassword(newPassword)) {
      setError(t('auth:forgot.passwordWeak'));
      return;
    }
    if (newPassword !== confirm) {
      setError(t('auth:forgot.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.changePassword({
        ...(currentPassword ? { currentPassword } : {}),
        newPassword,
      });
      await useAuthStore.getState().setSession(normalizeAuthResult(result));
      alert({
        title: t('auth:changePassword.successTitle'),
        message: t('auth:changePassword.successBody'),
        icon: 'shield',
      });
      navigation.goBack();
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.code === 'INVALID_CREDENTIALS') {
        setError(t('auth:changePassword.currentIncorrect'));
      } else if (parsed.code === 'VALIDATION_ERROR' && !currentPassword) {
        setError(t('auth:changePassword.currentRequired'));
      } else {
        setError(getUserFacingMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle
        title={t('auth:changePassword.title')}
        subtitle={
          hasEmail
            ? t('auth:changePassword.subtitleWithEmail')
            : t('auth:changePassword.subtitleOtp')
        }
      />

      <Card style={styles.card}>
        <View style={styles.iconRow}>
          <KeyRound size={18} color={theme.colors.brand.primary} />
        </View>

        <TextField
          label={t('auth:changePassword.currentPassword')}
          value={currentPassword}
          onChangeText={(v) => {
            setCurrentPassword(v);
            if (error) setError(null);
          }}
          secureTextEntry
          placeholder={t('auth:changePassword.currentPlaceholder')}
          autoComplete="password"
        />

        <TextField
          label={t('auth:changePassword.newPassword')}
          value={newPassword}
          onChangeText={(v) => {
            setNewPassword(v);
            if (error) setError(null);
          }}
          secureTextEntry
          placeholder={t('auth:forgot.newPasswordPlaceholder')}
          autoComplete="password-new"
        />
        <PasswordRequirements password={newPassword} />

        <TextField
          label={t('auth:forgot.confirmPassword')}
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            if (error) setError(null);
          }}
          secureTextEntry
          placeholder={t('auth:forgot.confirmPasswordPlaceholder')}
          autoComplete="password-new"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={t('auth:changePassword.submit')}
          loading={loading}
          disabled={!canSubmit}
          onPress={() => void handleSubmit()}
          fullWidth
        />
        <Button
          label={t('common:cancel')}
          variant="ghost"
          onPress={() => navigation.goBack()}
          fullWidth
        />
      </Card>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    card: { gap: theme.spacing.md },
    iconRow: { marginBottom: theme.spacing.xs },
    error: {
      ...theme.typography.presets.body,
      color: theme.colors.semantic.error,
    },
  });
}
