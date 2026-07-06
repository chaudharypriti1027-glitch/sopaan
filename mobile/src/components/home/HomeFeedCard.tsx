import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { homeFeedCard, HOME_UI, homePressFeedback } from './homeTheme';

type HomeFeedCardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Gold gradient rule along the top edge. */
  accentTop?: boolean;
  /** Left stripe color (nudge tone, subject accent, etc.). */
  accentLeft?: string;
  /** Soft tinted card background. */
  tint?: string;
  testID?: string;
};

/**
 * Shared elevated feed card — white surface, 3D bevel, optional gold top rule / left accent.
 */
export function HomeFeedCard({
  children,
  onPress,
  style,
  contentStyle,
  accentTop = false,
  accentLeft,
  tint,
  testID,
}: HomeFeedCardProps) {
  const styles = useMemo(() => createStyles(Boolean(accentLeft)), [accentLeft]);

  const body = (
    <View
      style={[
        styles.card,
        tint ? { backgroundColor: tint } : null,
        style,
      ]}
      testID={testID}
    >
      {accentTop ? (
        <LinearGradient
          colors={[HOME_UI.goldLt, HOME_UI.gold]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.topAccent}
        />
      ) : null}
      {accentLeft ? (
        <View style={[styles.leftAccent, { backgroundColor: accentLeft }]} />
      ) : null}
      <View style={styles.topSheen} pointerEvents="none" />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );

  if (!onPress) {
    return body;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && homePressFeedback]}
    >
      {body}
    </Pressable>
  );
}

function createStyles(hasLeftAccent: boolean) {
  return StyleSheet.create({
    pressable: {
      borderRadius: HOME_UI.cardRadiusLg,
    },
    card: {
      overflow: 'hidden',
      ...homeFeedCard(),
    },
    topAccent: {
      height: 3,
      width: '100%',
    },
    leftAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      borderTopLeftRadius: HOME_UI.cardRadiusLg,
      borderBottomLeftRadius: HOME_UI.cardRadiusLg,
      zIndex: 2,
    },
    topSheen: {
      position: 'absolute',
      top: hasLeftAccent ? 3 : 0,
      left: hasLeftAccent ? 4 : 0,
      right: 0,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.65)',
      zIndex: 1,
    },
    content: {
      zIndex: 1,
    },
  });
}
