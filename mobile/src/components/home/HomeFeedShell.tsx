import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { HOME_UI } from './homeTheme';

type HomeFeedShellProps = {
  children: ReactNode;
  compactTop?: boolean;
};

/** Cream feed continuum under the floating Today card — no raised sheet. */
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
      marginTop: compactTop ? -2 : 4,
      zIndex: 4,
      backgroundColor: HOME_UI.bg,
    },
    surface: {
      paddingTop: compactTop ? 8 : HOME_UI.feedTopPad,
      paddingBottom: 8,
    },
  });
}
