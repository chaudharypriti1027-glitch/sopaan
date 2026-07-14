import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Shield, Sparkles, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { Text } from '../Text';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

const PERKS = [
  { key: 'secure', Icon: Shield, tone: AUTH_UI.sageDeep, bg: AUTH_UI.sageSoft },
  { key: 'fast', Icon: Zap, tone: AUTH_UI.goldDeep, bg: AUTH_UI.goldSoft },
  { key: 'ai', Icon: Sparkles, tone: AUTH_UI.accent, bg: AUTH_UI.accentSoft },
] as const;

export function LoginPerkStrip() {
  const { t } = useTranslation('auth');
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.row} testID="login-perk-strip">
      {PERKS.map((perk, index) => {
        const Icon = perk.Icon;
        return (
          <Animated.View
            key={perk.key}
            entering={
              reducedMotion
                ? undefined
                : FadeInDown.duration(320)
                    .delay(120 + index * 60)
                    .reduceMotion(ReduceMotion.System)
            }
            style={styles.chip}
          >
            <View style={[styles.iconWrap, { backgroundColor: perk.bg }]}>
              <Icon size={12} color={perk.tone} strokeWidth={2.2} />
            </View>
            <Text style={styles.label}>{t(`login.perks.${perk.key}`)}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    chip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: 12,
      backgroundColor: '#FAFAF8',
      borderWidth: 1,
      borderColor: AUTH_UI.border,
    },
    iconWrap: {
      width: 22,
      height: 22,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontFamily: AUTH_FONTS.semibold,
      fontSize: 10,
      fontWeight: '700',
      color: AUTH_UI.label,
    },
  });
}
