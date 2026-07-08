import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { HOME_UI } from './homeTheme';

type HomeFeedShellProps = {
  children: ReactNode;
  compactTop?: boolean;
};

export function HomeFeedShell({ children, compactTop = false }: HomeFeedShellProps) {
  const styles = useMemo(() => createStyles(compactTop), [compactTop]);

  return (
    <View style={styles.shell}>
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
      backgroundColor: HOME_UI.bg,
    },
    surface: {
      paddingTop: compactTop ? 12 : HOME_UI.feedTopPad,
      paddingBottom: 8,
    },
  });
}
