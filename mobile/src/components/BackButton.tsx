import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { hitSlopForSize } from '../a11y/hitSlop';
import { scalableTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';

type BackButtonProps = {
  onPress: () => void;
};

export function BackButton({ onPress }: BackButtonProps) {
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('back')}
      onPress={onPress}
      hitSlop={hitSlopForSize(48, 44)}
      style={styles.button}
    >
      <Text {...scalableTextProps} style={styles.label}>
        {t('back')}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    button: {
      minHeight: theme.a11y.minTouchTarget,
      minWidth: theme.a11y.minTouchTarget,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xs,
    },
    label: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.brand.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
  });
}
