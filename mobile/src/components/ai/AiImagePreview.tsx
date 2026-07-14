import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Text } from '../Text';
import { OptimizedImage } from '../OptimizedImage';
import { useTheme } from '../../theme';
import { AI_UI, aiPremiumCard, aiPressFeedback } from './aiTheme';

type AiImagePreviewProps = {
  uri: string;
  label: string;
  removeLabel: string;
  onRemove: () => void;
};

export function AiImagePreview({ uri, label, removeLabel, onRemove }: AiImagePreviewProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <OptimizedImage uri={uri} style={styles.thumb} />
        <View style={styles.copy}>
          <Text style={styles.label}>{label}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={removeLabel}
            onPress={onRemove}
            style={({ pressed }) => [styles.removeBtn, pressed && aiPressFeedback]}
          >
            <X size={12} color={AI_UI.goldDeep} strokeWidth={2.5} />
            <Text style={styles.removeText}>{removeLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
    },
    card: {
      ...aiPremiumCard(),
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: 10,
      borderColor: AI_UI.goldBorder,
      backgroundColor: AI_UI.goldSoft,
    },
    thumb: {
      width: 52,
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: AI_UI.goldBorder,
    },
    copy: {
      flex: 1,
      gap: 4,
    },
    label: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: AI_UI.ink,
    },
    removeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      paddingVertical: 2,
    },
    removeText: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: AI_UI.goldDeep,
    },
  });
}
