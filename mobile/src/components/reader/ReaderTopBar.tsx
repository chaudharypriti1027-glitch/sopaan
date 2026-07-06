import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import type { ReaderThemeTokens } from './readerTheme';

type ReaderTopBarProps = {
  title: string;
  theme: ReaderThemeTokens;
  onBack: () => void;
  onOpenMenu: () => void;
};

export function ReaderTopBar({ title, theme, onBack, onOpenMenu }: ReaderTopBarProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <ChevronLeft size={22} color={theme.text} strokeWidth={2.2} />
      </Pressable>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reader options"
        onPress={onOpenMenu}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <MoreHorizontal size={22} color={theme.text} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

function createStyles(theme: ReaderThemeTokens, topInset: number) {
  return StyleSheet.create({
    bar: {
      paddingTop: topInset + 6,
      paddingBottom: 10,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.toolbarBorder,
      backgroundColor: theme.toolbarBg,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.7,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.2,
    },
  });
}
