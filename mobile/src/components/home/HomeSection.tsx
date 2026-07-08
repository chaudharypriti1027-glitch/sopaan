import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { HOME_UI } from './homeTheme';

type HomeSectionProps = {
  children: ReactNode;
  testID?: string;
  isFirst?: boolean;
  padded?: boolean;
};

export function HomeSection({
  children,
  testID,
  isFirst = false,
  padded = true,
}: HomeSectionProps) {
  const styles = useMemo(() => createStyles(isFirst, padded), [isFirst, padded]);

  return (
    <View style={styles.wrap} testID={testID}>
      {children}
    </View>
  );
}

function createStyles(isFirst: boolean, padded: boolean) {
  return StyleSheet.create({
    wrap: {
      marginTop: isFirst ? 0 : HOME_UI.sectionGap,
      ...(padded ? { paddingHorizontal: HOME_UI.horizontalPad } : null),
    },
  });
}
