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
        colors={[HOME_UI.surface, HOME_UI.bg, HOME_UI.bg]}
        locations={[0, 0.12, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.hairline} />
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
      shadowColor: HOME_UI.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
    },
    hairline: {
      alignSelf: 'center',
      width: 44,
      height: 3,
      borderRadius: 99,
      backgroundColor: HOME_UI.gold,
      marginTop: 10,
      opacity: 0.85,
      zIndex: 2,
    },
    surface: {
      paddingTop: compactTop ? 8 : HOME_UI.feedTopPad,
      paddingBottom: 8,
    },
  });
}
