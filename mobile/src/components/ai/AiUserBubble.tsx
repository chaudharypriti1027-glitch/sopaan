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
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bubble}
      >
        {imageUri ? <OptimizedImage uri={imageUri} style={styles.image} /> : null}
        <Text style={styles.text}>{text}</Text>
      </LinearGradient>
      <View style={styles.tail} />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      alignItems: 'flex-end',
      position: 'relative',
    },
    bubble: {
      maxWidth: '82%',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 14,
      borderRadius: AI_UI.bubbleRadius,
      borderTopRightRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.28)',
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 20,
      elevation: 4,
      gap: theme.spacing.sm,
    },
    tail: {
      position: 'absolute',
      right: 10,
      bottom: -1,
      width: 10,
      height: 10,
      backgroundColor: AI_UI.gradientEnd,
      transform: [{ rotate: '45deg' }],
      borderRadius: 2,
    },
    image: {
      width: 200,
      height: 140,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    text: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}
