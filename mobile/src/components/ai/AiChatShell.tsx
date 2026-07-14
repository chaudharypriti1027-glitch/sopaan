import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AI_UI } from './aiTheme';

type AiChatShellProps = {
  children: ReactNode;
};

/** Cream body shell that curves over the navy header. */
export function AiChatShell({ children }: AiChatShellProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[AI_UI.card, AI_UI.bg, AI_UI.bg]}
        locations={[0, 0.08, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.handle} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    shell: {
      flex: 1,
      marginTop: -20,
      zIndex: 2,
      borderTopLeftRadius: AI_UI.shellRadius,
      borderTopRightRadius: AI_UI.shellRadius,
      backgroundColor: AI_UI.bg,
      overflow: 'hidden',
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 8,
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 3,
      borderRadius: 99,
      backgroundColor: AI_UI.gold,
      marginTop: 10,
      opacity: 0.85,
    },
    body: {
      flex: 1,
    },
  });
}
