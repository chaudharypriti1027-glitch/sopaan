import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HOME_UI } from './homeTheme';

type HomeFeedShellProps = {
  children: ReactNode;
  compactTop?: boolean;
};

export function HomeFeedShell({ children, compactTop = false }: HomeFeedShellProps) {
  const styles = useMemo(() => createStyles(compactTop), [compactTop]);

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[HOME_UI.goldLt, HOME_UI.gold, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topSheen}
        pointerEvents="none"
      />
      <View style={styles.surface}>{children}</View>
    </View>
  );
}

function createStyles(compactTop: boolean) {
  return StyleSheet.create({
    shell: {
      marginTop: compactTop ? -4 : 0,
      zIndex: 4,
      overflow: 'hidden',
      borderTopLeftRadius: HOME_UI.heroRadius,
      borderTopRightRadius: HOME_UI.heroRadius,
    },
    topSheen: {
      position: 'absolute',
      top: 0,
      left: 24,
      right: 24,
      height: 2,
      zIndex: 2,
      borderRadius: 1,
    },
    surface: {
      paddingTop: compactTop ? 10 : HOME_UI.feedTopPad,
      paddingBottom: 8,
      gap: 0,
      backgroundColor: HOME_UI.bg,
    },
  });
}
