import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { HOME_UI } from './homeTheme';

type HomeSectionProps = {
  children: ReactNode;
  testID?: string;
  /** Overlap hero gradient like the For You nudge card. */
  overlapHero?: boolean;
  /** First block under the hero — slightly tighter top spacing. */
  isFirst?: boolean;
  /** Horizontal inset for section body (default true). */
  padded?: boolean;
};

/** Consistent home feed section shell — spacing, overlap, and padding. */
export function HomeSection({
  children,
  testID,
  overlapHero = false,
  isFirst = false,
  padded = true,
}: HomeSectionProps) {
  const styles = useMemo(() => createStyles(overlapHero, isFirst, padded), [overlapHero, isFirst, padded]);

  return (
    <View style={styles.wrap} testID={testID}>
      {children}
    </View>
  );
}

function createStyles(overlapHero: boolean, isFirst: boolean, padded: boolean) {
  const marginTop = overlapHero
    ? HOME_UI.forYouLift
    : isFirst
      ? 16
      : HOME_UI.sectionGap;

  return StyleSheet.create({
    wrap: {
      marginTop,
      ...(padded ? { paddingHorizontal: 16 } : null),
    },
  });
}
