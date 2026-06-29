import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { scalableTextProps } from '../../a11y/textProps';
import { AUTH_UI } from './authTheme';

type AuthStepLabelProps = {
  children: string;
};

export function AuthStepLabel({ children }: AuthStepLabelProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Text {...scalableTextProps} style={styles.label}>
      {children}
    </Text>
  );
}

function createStyles() {
  return StyleSheet.create({
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: AUTH_UI.label,
      marginBottom: 6,
      marginLeft: 4,
    },
  });
}
