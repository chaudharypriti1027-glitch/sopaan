import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { SopaanLogo } from '../SopaanLogo';
import { Text } from '../Text';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

type AuthFlowHeaderProps = {
  title: string;
  subtitle?: string;
  /** Row rendered under the subtitle — e.g. masked phone + Change link. */
  accessory?: ReactNode;
  testID?: string;
};

/** Centered small logo + serif title on the navy canvas (Sign-in Flow screens). */
export function AuthFlowHeader({ title, subtitle, accessory, testID }: AuthFlowHeaderProps) {
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(), []);

  const enter = reducedMotion
    ? undefined
    : FadeInDown.duration(420).delay(60).reduceMotion(ReduceMotion.System);

  return (
    <Animated.View entering={enter} style={styles.root} testID={testID}>
      <View style={styles.logoWrap}>
        <SopaanLogo size={62} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
    </Animated.View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      alignItems: 'center',
      marginTop: 10,
    },
    logoWrap: {
      borderRadius: 17,
      shadowColor: AUTH_UI.gold,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 8,
    },
    title: {
      fontFamily: AUTH_FONTS.display,
      fontSize: 27,
      lineHeight: 33,
      letterSpacing: 0.6,
      color: AUTH_UI.onCanvas,
      textAlign: 'center',
      marginTop: 24,
    },
    subtitle: {
      fontFamily: AUTH_FONTS.regular,
      fontSize: 15,
      lineHeight: 21,
      color: 'rgba(233,222,196,0.6)',
      textAlign: 'center',
      marginTop: 10,
      letterSpacing: 0.2,
      maxWidth: 320,
    },
    accessory: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 6,
    },
  });
}
