import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HOME_UI, homeSectionPanel } from './homeTheme';

type HomeSectionProps = {
  children: ReactNode;
  testID?: string;
  isFirst?: boolean;
  highlighted?: boolean;
  padded?: boolean;
  panel?: boolean;
  panelTone?: 'default' | 'gold';
};

export function HomeSection({
  children,
  testID,
  isFirst = false,
  highlighted = false,
  padded = true,
  panel = false,
  panelTone = 'default',
}: HomeSectionProps) {
  const styles = useMemo(
    () => createStyles(isFirst, highlighted, padded, panel, panelTone),
    [highlighted, isFirst, padded, panel, panelTone],
  );

  const body =
    panel && !highlighted ? (
      <View style={styles.panel}>
        {panelTone === 'gold' ? (
          <LinearGradient
            colors={[HOME_UI.goldLt, HOME_UI.gold]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.panelAccent}
          />
        ) : (
          <View style={styles.panelRule} />
        )}
        {children}
      </View>
    ) : (
      children
    );

  return (
    <View style={styles.wrap} testID={testID}>
      {highlighted ? <View style={styles.highlight}>{body}</View> : body}
    </View>
  );
}

function createStyles(
  isFirst: boolean,
  highlighted: boolean,
  padded: boolean,
  panel: boolean,
  panelTone: 'default' | 'gold',
) {
  return StyleSheet.create({
    wrap: {
      marginTop: isFirst ? 0 : HOME_UI.sectionGap,
      ...(padded && !highlighted && !panel ? { paddingHorizontal: HOME_UI.horizontalPad } : null),
      ...(panel && !highlighted ? { paddingHorizontal: HOME_UI.horizontalPad } : null),
    },
    highlight: {
      marginHorizontal: HOME_UI.horizontalPad - 4,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 6,
      borderRadius: HOME_UI.cardRadiusLg,
      backgroundColor: HOME_UI.surface,
      borderWidth: 1,
      borderColor: HOME_UI.goldBorder,
      borderBottomColor: HOME_UI.bevelDark,
      borderRightColor: HOME_UI.bevelDark,
    },
    panel: {
      ...homeSectionPanel(panelTone),
      overflow: 'hidden',
    },
    panelAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      zIndex: 1,
    },
    panelRule: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: HOME_UI.gold,
      opacity: 0.4,
      zIndex: 1,
    },
  });
}
