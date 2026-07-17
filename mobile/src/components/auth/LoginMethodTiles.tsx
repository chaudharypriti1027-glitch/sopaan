import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Phone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Text } from '../Text';
import { AUTH_FONTS, AUTH_UI } from './authTheme';
import { platformShadow } from '../../utils/platformShadow';

type LoginMethodTilesProps = {
  onGooglePress: () => void;
  onPhonePress: () => void;
  googleDisabled?: boolean;
  phoneDisabled?: boolean;
};

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.6 12.2c0-.6-.1-1.3-.2-1.9H12v3.6h6c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8z"
      />
      <Path
        fill="#34A853"
        d="M12 23c3.1 0 5.7-1 3.7-2.8l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 20.6 7.6 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.6 13.8c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V6.5H1.8C1 8.1.6 9.9.6 11.6s.4 3.5 1.2 5.1l3.8-2.9z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.9c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.4 15.1.3 12 .3 7.6.3 3.7 2.7 1.8 6.5l3.8 2.9C6.5 6.8 9 4.9 12 4.9z"
      />
    </Svg>
  );
}

export function LoginMethodTiles({
  onGooglePress,
  onPhonePress,
  googleDisabled,
  phoneDisabled,
}: LoginMethodTilesProps) {
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.row} testID="login-method-tiles">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('login.continueGoogle')}
        disabled={googleDisabled}
        testID="login-google"
        onPress={onGooglePress}
        style={({ pressed }) => [
          styles.tile,
          googleDisabled && styles.tileDisabled,
          pressed && !googleDisabled && styles.tilePressed,
        ]}
      >
        <View style={[styles.iconTile, styles.iconGoogle]}>
          <GoogleMark />
        </View>
        <View style={styles.copy}>
          <Text style={styles.tileTitle}>{t('login.methodGoogle')}</Text>
          <Text style={styles.tileHint}>{t('login.methodGoogleHint')}</Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('login.usePhoneInstead')}
        disabled={phoneDisabled}
        testID="login-use-phone"
        onPress={onPhonePress}
        style={({ pressed }) => [
          styles.tile,
          phoneDisabled && styles.tileDisabled,
          pressed && !phoneDisabled && styles.tilePressed,
        ]}
      >
        <View style={[styles.iconTile, styles.iconPhone]}>
          <Phone size={16} color={AUTH_UI.sageDeep} strokeWidth={2.2} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.tileTitle}>{t('login.methodPhone')}</Text>
          <Text style={styles.tileHint}>{t('login.methodPhoneHint')}</Text>
        </View>
      </Pressable>
    </View>
  );
}

type AuthErrorBannerProps = {
  message: string;
  testID?: string;
  /** Brighter error treatment for the navy canvas. */
  dark?: boolean;
};

export function AuthErrorBanner({ message, testID, dark = false }: AuthErrorBannerProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      exiting={FadeOut.duration(180)}
      style={[styles.banner, dark && styles.bannerDark]}
      testID={testID}
    >
      <View style={[styles.dot, dark && styles.dotDark]} />
      <Text style={[styles.text, dark && styles.textDark]}>{message}</Text>
    </Animated.View>
  );
}

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    tile: {
      flex: 1,
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 16,
      backgroundColor: '#FAFAF8',
      borderWidth: 1,
      borderColor: 'rgba(28,36,80,0.1)',
      ...platformShadow({
        color: '#000000',
        offsetY: 4,
        opacity: 0.05,
        radius: 10,
        elevation: 1,
      }),
    },
    tilePressed: {
      backgroundColor: '#F0EDE3',
      borderColor: 'rgba(28,36,80,0.16)',
    },
    tileDisabled: {
      opacity: 0.55,
    },
    iconTile: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconGoogle: {
      backgroundColor: '#EDF3FE',
    },
    iconPhone: {
      backgroundColor: AUTH_UI.sageSoft,
    },
    copy: {
      gap: 2,
    },
    tileTitle: {
      fontFamily: AUTH_FONTS.bold,
      fontSize: 12,
      fontWeight: '800',
      color: AUTH_UI.ink,
    },
    tileHint: {
      fontFamily: AUTH_FONTS.medium,
      fontSize: 10,
      lineHeight: 14,
      color: AUTH_UI.muted,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: 'rgba(196,80,63,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(196,80,63,0.2)',
    },
    bannerDark: {
      backgroundColor: 'rgba(224,122,95,0.12)',
      borderColor: 'rgba(224,122,95,0.35)',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 4,
      backgroundColor: '#C4634F',
    },
    dotDark: {
      backgroundColor: '#E07A5F',
    },
    text: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: '#C4634F',
      lineHeight: 17,
    },
    textDark: {
      color: '#F0B4A2',
    },
  });
}
