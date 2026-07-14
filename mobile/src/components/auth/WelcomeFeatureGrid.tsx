import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WELCOME_FEATURES } from '../../content/authBrandContent';
import { Text } from '../Text';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

const TONE_COLORS = {
  sage: { tone: AUTH_UI.sageDeep, bg: AUTH_UI.sageSoft },
  gold: { tone: AUTH_UI.goldDeep, bg: AUTH_UI.goldSoft },
  accent: { tone: AUTH_UI.accent, bg: AUTH_UI.accentSoft },
  accentDeep: { tone: AUTH_UI.accentDeep, bg: AUTH_UI.accentSoft },
} as const;

export function WelcomeFeatureGrid() {
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.grid} testID="welcome-feature-grid">
      {WELCOME_FEATURES.map(({ key, Icon, tone, bg }) => {
        const iconColor = TONE_COLORS[tone].tone;
        const backgroundColor = TONE_COLORS[bg].bg;
        return (
          <View key={key} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor }]}>
              <Icon size={18} color={iconColor} strokeWidth={2.2} />
            </View>
            <Text style={styles.label}>{t(`welcome.features.${key}`)}</Text>
            <Text style={styles.hint}>{t(`welcome.features.${key}Hint`)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 4,
    },
    card: {
      width: '48%',
      flexGrow: 1,
      minWidth: '46%',
      gap: 4,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: AUTH_UI.inputRadius,
      backgroundColor: '#FAFAF8',
      borderWidth: 1,
      borderColor: AUTH_UI.border,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    label: {
      fontFamily: AUTH_FONTS.bold,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '800',
      color: AUTH_UI.ink,
    },
    hint: {
      fontFamily: AUTH_FONTS.medium,
      fontSize: 11,
      lineHeight: 15,
      color: AUTH_UI.muted,
    },
  });
}
