import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SopaanLogo } from '../../components';
import { Text } from '../../components/Text';
import { PREMIUM } from '../../components/premium/premiumStyles';
import { AUTH_UI } from '../../components/auth/authTheme';
import type { AuthStackParamList } from '../../navigation/types';

type WelcomeNav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const { t } = useTranslation('auth');
  const navigation = useNavigation<WelcomeNav>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets), [insets]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...PREMIUM.heroGradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.decoGold} pointerEvents="none" />
        <SopaanLogo size={82} />
        <Text style={styles.wordmark}>
          S<Text style={styles.wordmarkO}>O</Text>PAAN
        </Text>
        <Text style={styles.heroTagline}>{t('welcome.tagline')}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.highlight}>
          <View style={styles.highlightIcon}>
            <Sparkles size={20} color={AUTH_UI.goldDeep} strokeWidth={2} />
          </View>
          <Text style={styles.highlightText}>{t('welcome.highlight')}</Text>
        </View>

        <View style={styles.cta}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('welcome.getStarted')}
            onPress={() => navigation.navigate('OtpLogin')}
            style={({ pressed }) => [styles.getBtnWrap, pressed && styles.pressed]}
            testID="welcome-get-started"
          >
            <LinearGradient
              colors={[...AUTH_UI.gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.getBtn}
            >
              <Text style={styles.getBtnLabel}>{t('welcome.getStarted')}</Text>
              <ArrowRight size={19} color="#E3C97F" strokeWidth={2.2} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: AUTH_UI.bg,
    },
    hero: {
      flex: 1,
      paddingTop: insets.top + 32,
      paddingBottom: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      overflow: 'hidden',
      gap: 4,
    },
    decoGold: {
      position: 'absolute',
      top: -60,
      right: -50,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(194,154,78,0.22)',
    },
    wordmark: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 27,
      lineHeight: 32,
      letterSpacing: 1,
      color: '#FFFFFF',
      marginTop: 18,
    },
    wordmarkO: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 27,
      lineHeight: 32,
      letterSpacing: 1,
      color: '#E3C97F',
    },
    heroTagline: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 4,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    body: {
      paddingHorizontal: 26,
      paddingTop: 24,
      paddingBottom: insets.bottom + 24,
      gap: 20,
    },
    highlight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 18,
      backgroundColor: AUTH_UI.card,
      borderWidth: 1,
      borderColor: AUTH_UI.border,
    },
    highlightIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: AUTH_UI.goldSoft,
    },
    highlightText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 19,
      color: AUTH_UI.muted,
    },
    cta: {
      gap: 14,
    },
    getBtnWrap: {
      alignSelf: 'stretch',
    },
    pressed: {
      opacity: 0.9,
    },
    getBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      borderRadius: AUTH_UI.btnRadius,
      paddingVertical: 17,
      shadowColor: AUTH_UI.accent,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
      elevation: 6,
    },
    getBtnLabel: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.2,
      color: '#FFFFFF',
    },
  });
}
