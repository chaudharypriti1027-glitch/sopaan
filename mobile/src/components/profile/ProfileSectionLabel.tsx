import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';

type ProfileSectionLabelProps = {
  title: string;
};

export function ProfileSectionLabel({ title }: ProfileSectionLabelProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <Text style={styles.label}>{title}</Text>;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    label: {
      marginTop: 22,
      marginBottom: 11,
      marginHorizontal: 6,
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: theme.colors.text.tertiary,
    },
  });
}
