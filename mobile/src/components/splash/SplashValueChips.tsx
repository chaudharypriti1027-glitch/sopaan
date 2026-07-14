import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { AUTH_BRAND_VALUES } from '../../content/authBrandContent';
import { Text } from '../Text';
import { AUTH_FONTS } from '../auth/authTheme';

type SplashValueChipsProps = {
  testID?: string;
};

export function SplashValueChips({ testID }: SplashValueChipsProps) {
  const { t } = useTranslation('auth');
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.row} testID={testID}>
      {AUTH_BRAND_VALUES.map((item, index) => {
        const Icon = item.icon;
        return (
          <Animated.View
            key={item.key}
            entering={
              reducedMotion
                ? undefined
                : FadeInDown.duration(380)
                    .delay(520 + index * 90)
                    .reduceMotion(ReduceMotion.System)
            }
            style={styles.chip}
          >
            <View style={styles.iconWrap}>
              <Icon size={13} color="#E3C97F" strokeWidth={2.2} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {t(item.labelKey)}
            </Text>
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
      width: '100%',
      maxWidth: 320,
      paddingHorizontal: 8,
    },
    chip: {
      flex: 1,
      alignItems: 'center',
      gap: 5,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    iconWrap: {
      width: 26,
      height: 26,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    label: {
      fontFamily: AUTH_FONTS.semibold,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
    },
  });
}
