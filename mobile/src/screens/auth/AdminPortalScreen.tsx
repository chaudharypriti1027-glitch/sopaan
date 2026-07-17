import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ExternalLink, Shield } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthFormCard } from '../../components/auth/AuthFormCard';
import { AuthScreen } from '../../components/auth/AuthScreen';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { AUTH_UI } from '../../components/auth/authTheme';
import { getAdminConsoleUrl, openAdminConsole } from '../../auth/adminPortal';
import type { AuthStackParamList } from '../../navigation/types';
import { PREMIUM } from '../../components/premium/premiumStyles';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'AdminPortal'>;

export function AdminPortalScreen() {
  const { t } = useTranslation('auth');
  const navigation = useNavigation<Nav>();
  const styles = useMemo(() => createStyles(), []);
  const adminUrl = getAdminConsoleUrl();

  const handleOpenConsole = () => {
    openAdminConsole(adminUrl);
  };

  const handleStudentLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <AuthScreen scroll={false}>
      <AuthFormCard overlap premium>
        <View style={styles.wrap}>
          <LinearGradient colors={[...PREMIUM.heroGradient]} style={styles.iconBadge}>
            <Shield size={28} color={PREMIUM.gold} />
          </LinearGradient>

          <Text style={styles.title}>{t('adminPortal.title')}</Text>
          <Text style={styles.body}>{t('adminPortal.body')}</Text>

          <PrimaryButton label={t('adminPortal.openConsole')} onPress={handleOpenConsole} />

          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(adminUrl)}
            style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
          >
            <ExternalLink size={16} color={AUTH_UI.goldDeep} />
            <Text style={styles.linkText}>{adminUrl}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleStudentLogin}
            style={({ pressed }) => [styles.secondary, pressed && styles.linkPressed]}
          >
            <Text style={styles.secondaryText}>{t('adminPortal.studentLogin')}</Text>
          </Pressable>

          {Platform.OS === 'web' ? (
            <Text style={styles.hint}>{t('adminPortal.webHint')}</Text>
          ) : null}
        </View>
      </AuthFormCard>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      gap: 14,
      paddingVertical: 8,
    },
    iconBadge: {
      width: 72,
      height: 72,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    title: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.4,
      color: AUTH_UI.ink,
      textAlign: 'center',
    },
    body: {
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 14,
      lineHeight: 22,
      color: AUTH_UI.muted,
      textAlign: 'center',
      marginBottom: 8,
      maxWidth: 360,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: AUTH_UI.goldSoft,
    },
    linkPressed: { opacity: 0.88 },
    linkText: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 12,
      color: AUTH_UI.goldDeep,
    },
    secondary: {
      marginTop: 4,
      paddingVertical: 10,
    },
    secondaryText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 13,
      color: AUTH_UI.accent,
    },
    hint: {
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 12,
      lineHeight: 18,
      color: AUTH_UI.muted,
      textAlign: 'center',
      maxWidth: 380,
      marginTop: 8,
    },
  });
}
