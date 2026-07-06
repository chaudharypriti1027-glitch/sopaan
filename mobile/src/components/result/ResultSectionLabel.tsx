import { StyleSheet } from 'react-native';
import { Text } from '../Text';
import { RESULT_UI } from './resultTheme';

export function ResultSectionLabel({ title }: { title: string }) {
  return (
    <Text style={styles.label}>{title}</Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: RESULT_UI.faint,
    marginTop: 22,
    marginBottom: 11,
    marginHorizontal: 6,
  },
});
