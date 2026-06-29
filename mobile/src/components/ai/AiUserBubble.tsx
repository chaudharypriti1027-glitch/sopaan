import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../Text';
import { OptimizedImage } from '../OptimizedImage';
import { useTheme } from '../../theme';
import { AI_UI } from './aiTheme';

type AiUserBubbleProps = {
  text: string;
  imageUri?: string;
};

export function AiUserBubble({ text, imageUri }: AiUserBubbleProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={[AI_UI.primary, AI_UI.gradientEnd]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.bubble}
      >
        {imageUri ? <OptimizedImage uri={imageUri} style={styles.image} /> : null}
        <Text style={styles.text}>{text}</Text>
      </LinearGradient>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      alignItems: 'flex-end',
    },
    bubble: {
      maxWidth: '78%',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 14,
      borderRadius: 16,
      borderTopRightRadius: 4,
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 22,
      elevation: 3,
      gap: theme.spacing.sm,
    },
    image: {
      width: 200,
      height: 140,
      borderRadius: 12,
    },
    text: {
      fontSize: 13.5,
      lineHeight: 20,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}
