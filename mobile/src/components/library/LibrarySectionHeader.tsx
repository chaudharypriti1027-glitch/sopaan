import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '../Text';
import { LIBRARY_UI } from './libraryTheme';

type LibrarySectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function LibrarySectionHeader({ title, actionLabel, onActionPress }: LibrarySectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleWrap}>
        <View style={styles.bar} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <ChevronRight size={14} color={LIBRARY_UI.navy} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bar: {
    width: 4,
    height: 16,
    borderRadius: 99,
    backgroundColor: LIBRARY_UI.goldLt,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: LIBRARY_UI.ink,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: LIBRARY_UI.navy,
  },
  pressed: { opacity: 0.85 },
});
