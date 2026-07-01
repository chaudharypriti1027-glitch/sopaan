import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ClipboardCheck, Sparkles, Trophy } from 'lucide-react-native';
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
        <View style={[styles.decoGold]} pointerEvents="none" />
        <View style={[styles.decoSage]} pointerEvents="none" />
        <SopaanLogo size={82} />
        <Text style={styles.wordmark}>
          S<Text style={styles.wordmarkO}>O</Text>PAAN
        </Text>
        <Text style={styles.heroTagline}>{t('welcome.tagline')}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.features}>
          <FeatureRow
            tone="navy"
            Icon={ClipboardCheck}
            title={t('welcome.feature1Title')}
            subtitle={t('welcome.feature1Subtitle')}
          />
          <FeatureRow
            tone="gold"
            Icon={Sparkles}
            title={t('welcome.feature2Title')}
            subtitle={t('welcome.feature2Subtitle')}
          />
          <FeatureRow
            tone="sage"
            Icon={Trophy}
            title={t('welcome.feature3Title')}
            subtitle={t('welcome.feature3Subtitle')}
          />
        </View>

        <View style={styles.cta}>
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotOn]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('welcome.getStarted')}
            onPress={() => navigation.navigate('Signup')}
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('welcome.loginLink')}
            onPress={() => navigation.navigate('Login')}
            style={styles.signinRow}
            testID="welcome-sign-in"
          >
            <Text style={styles.signinMuted}>{t('welcome.loginPrompt')} </Text>
            <Text style={styles.signinStrong}>{t('welcome.loginLink')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type FeatureTone = 'navy' | 'gold' | 'sage';

const TONE_STYLES: Record<FeatureTone, { bg: string; fg: string }> = {
  navy: { bg: '#E9EBF3', fg: AUTH_UI.accent },
  gold: { bg: '#F4EBD8', fg: AUTH_UI.goldDeep },
  sage: { bg: '#E4EDE9', fg: AUTH_UI.sageDeep },
};

function FeatureRow({
  tone,
  Icon,
  title,
  subtitle,
}: {
  tone: FeatureTone;
  Icon: typeof ClipboardCheck;
  title: string;
  subtitle: string;
}) {
  const toneStyle = TONE_STYLES[tone];
  return (
    <View style={featureRowStyles.row}>
      <View style={[featureRowStyles.tile, { backgroundColor: toneStyle.bg }]}>
        <Icon size={22} color={toneStyle.fg} strokeWidth={2} />
      </View>
      <View style={featureRowStyles.copy}>
        <Text style={featureRowStyles.title}>{title}</Text>
        <Text style={featureRowStyles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const featureRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tile: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: AUTH_UI.shadowSm,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: AUTH_UI.ink,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: AUTH_UI.muted,
    marginTop: 2,
  },
});

function createStyles(insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: AUTH_UI.bg,
    },
    hero: {
      paddingTop: insets.top + 24,
      paddingBottom: 40,
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
    decoSage: {
      position: 'absolute',
      bottom: -40,
      left: -50,
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: 'rgba(95,138,123,0.2)',
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
    },
    body: {
      flex: 1,
      paddingHorizontal: 26,
      paddingTop: 26,
      paddingBottom: insets.bottom + 24,
    },
    features: {
      gap: 18,
    },
    cta: {
      marginTop: 'auto',
      gap: 14,
    },
    dots: {
      flexDirection: 'row',
      gap: 7,
      justifyContent: 'center',
      marginBottom: 2,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: AUTH_UI.border,
    },
    dotOn: {
      width: 22,
      borderRadius: 99,
      backgroundColor: AUTH_UI.gold,
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
    signinRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 44,
    },
    signinMuted: {
      fontSize: 13,
      fontWeight: '600',
      color: AUTH_UI.muted,
    },
    signinStrong: {
      fontSize: 13,
      fontWeight: '800',
      color: AUTH_UI.accent,
    },
  });
}
