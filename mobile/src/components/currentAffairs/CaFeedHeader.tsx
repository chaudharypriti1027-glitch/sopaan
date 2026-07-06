import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { CA_UI } from './caTheme';

type CaFeedHeaderProps = {
  children: ReactNode;
};

/** Groups CA hero, stats, filters into one premium header block. */
export function CaFeedHeader({ children }: CaFeedHeaderProps) {
  const styles = useMemo(() => createStyles(), []);
  return <View style={styles.wrap}>{children}</View>;
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      marginHorizontal: -16,
      marginBottom: 8,
      backgroundColor: CA_UI.surface,
      borderBottomWidth: 1,
      borderBottomColor: CA_UI.border,
      overflow: 'hidden',
    },
  });
}
