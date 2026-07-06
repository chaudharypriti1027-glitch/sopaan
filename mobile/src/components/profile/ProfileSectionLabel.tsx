import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { PROFILE } from './profileTheme';

type ProfileSectionLabelProps = {
  title: string;
  /** Tighter spacing when used inside the scroll stack. */
  stacked?: boolean;
};

export function ProfileSectionLabel({ title, stacked = false }: ProfileSectionLabelProps) {
  const styles = useMemo(() => createStyles(stacked), [stacked]);

  return (
    <View style={styles.row}>
      <View style={styles.accent} />
      <Text style={styles.label}>{title}</Text>
    </View>
  );
}

function createStyles(stacked: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: stacked ? 10 : PROFILE.sectionGap,
      marginBottom: 11,
      marginHorizontal: 6,
    },
    accent: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: PROFILE.gold,
    },
    label: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: PROFILE.faint,
    },
  });
}
