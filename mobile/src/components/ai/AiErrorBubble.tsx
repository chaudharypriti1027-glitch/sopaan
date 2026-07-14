import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AI_UI } from './aiTheme';

type AiErrorBubbleProps = {
  message: string;
  retryLabel: string;
  onRetry?: () => void;
};

export function AiErrorBubble({ message, retryLabel, onRetry }: AiErrorBubbleProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconShell}>
        <AlertCircle size={18} color={theme.colors.semantic.error} />
      </View>
      <View style={styles.card}>
        <Text style={styles.message}>{message}</Text>
        {onRetry ? (
          <Text style={styles.retry} onPress={onRetry}>
            {retryLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    iconShell: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: 'rgba(196,99,79,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      flex: 1,
      borderRadius: 16,
      borderTopLeftRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(196,99,79,0.22)',
      backgroundColor: AI_UI.card,
      padding: theme.spacing.md,
      gap: 8,
    },
    message: {
      fontSize: 13,
      lineHeight: 20,
      color: AI_UI.body,
      fontFamily: theme.typography.fonts.ui.medium,
    },
    retry: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: AI_UI.primary,
    },
  });
}
