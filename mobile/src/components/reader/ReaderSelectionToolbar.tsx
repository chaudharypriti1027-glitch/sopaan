import { Bookmark, Highlighter, Sparkles, Volume2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import type { ReaderThemeTokens } from './readerTheme';

type ReaderSelectionToolbarProps = {
  theme: ReaderThemeTokens;
  onExplain: () => void;
  onReadFromHere: () => void;
  onBookmark: () => void;
  onHighlight: () => void;
  onDismiss: () => void;
  isHighlighted: boolean;
  isBookmarking?: boolean;
};

export function ReaderSelectionToolbar({
  theme,
  onExplain,
  onReadFromHere,
  onBookmark,
  onHighlight,
  onDismiss,
  isHighlighted,
  isBookmarking,
}: ReaderSelectionToolbarProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(theme), [theme]);

  const actions = [
    { key: 'explain', label: t('reader.explainAi'), Icon: Sparkles, onPress: onExplain },
    { key: 'read', label: t('reader.readFromHere'), Icon: Volume2, onPress: onReadFromHere },
    { key: 'bookmark', label: t('reader.bookmark'), Icon: Bookmark, onPress: onBookmark },
    {
      key: 'highlight',
      label: isHighlighted ? t('reader.unhighlight') : t('reader.highlight'),
      Icon: Highlighter,
      onPress: onHighlight,
    },
  ] as const;

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.dismissArea} onPress={onDismiss} accessibilityRole="button" />
      <View style={styles.toolbar}>
        {actions.map(({ key, label, Icon, onPress }) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            disabled={key === 'bookmark' && isBookmarking}
            onPress={onPress}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Icon size={16} color={theme.accent} strokeWidth={2.2} />
            <Text style={styles.actionLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: ReaderThemeTokens) {
  return StyleSheet.create({
    wrap: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      zIndex: 20,
    },
    dismissArea: {
      flex: 1,
    },
    toolbar: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 18,
      paddingVertical: 10,
      paddingHorizontal: 8,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      backgroundColor: theme.toolbarBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.toolbarBorder,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    action: {
      flexGrow: 1,
      minWidth: '46%',
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionPressed: {
      backgroundColor: theme.accentSoft,
    },
    actionLabel: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
  });
}
