import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { GlassSurface } from '../GlassSurface';
import { PremiumIcon } from '../premium/PremiumIcon';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { AINudge } from '../../types/home';
import { nudgeCardTint, nudgePremiumTone } from './homeIconTone';
import { resolveHomeIcon } from './homeUtils';
import { HOME_UI } from './homeTheme';

type AINudgeCardProps = {
  nudge: AINudge;
  onPress?: (deeplink: string) => void;
  showForYouHeader?: boolean;
};

export function AINudgeCard({ nudge, onPress, showForYouHeader = true }: AINudgeCardProps) {
  const { theme } = useTheme();
  const tint = nudgeCardTint(nudge.tone);
  const iconTone = nudgePremiumTone(nudge.tone);
  const styles = useMemo(() => createStyles(theme, tint), [theme, tint]);
  const Icon = resolveHomeIcon(nudge.icon);

  const cardBody = (
    <View style={styles.card}>
      <View style={styles.iconTile}>
        <PremiumIcon Icon={Icon} tone={iconTone} size="md" filled />
      </View>

      <View style={styles.copy}>
        {showForYouHeader ? (
          <View style={styles.titleRow}>
            <Text style={styles.forYou}>For You</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>
                <Text style={styles.aiBadgeSpark}>✦ </Text>
                AI
              </Text>
            </View>
          </View>
        ) : null}
        <Text style={styles.subtitle} numberOfLines={2}>
          {nudge.title}
        </Text>
        {nudge.body ? (
          <Text style={styles.bodyText} numberOfLines={2}>
            {nudge.body}
          </Text>
        ) : null}
      </View>

      <View style={styles.arrow}>
        <ChevronRight size={18} color={tint.fg} strokeWidth={2.2} />
      </View>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(nudge.deeplink)}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      {showForYouHeader ? (
        <GlassSurface tone="gold" intensity={36} borderRadius={20} style={styles.glassWrap}>
          {cardBody}
        </GlassSurface>
      ) : (
        cardBody
      )}
    </Pressable>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  tint: { bg: string; fg: string; ring: string },
) {
  return StyleSheet.create({
    wrap: {
      borderRadius: 20,
    },
    pressed: { opacity: 0.96 },
    glassWrap: {
      overflow: 'hidden',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      backgroundColor: tint.bg,
      borderRadius: 20,
      paddingVertical: 15,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: tint.ring,
      shadowColor: HOME_UI.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 3,
    },
    iconTile: {
      flexShrink: 0,
    },
    copy: { flex: 1, minWidth: 0 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 5,
    },
    forYou: {
      fontSize: 14,
      fontWeight: '800',
      color: HOME_UI.accent,
    },
    aiBadge: {
      borderRadius: 99,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: HOME_UI.goldSoft,
      borderWidth: 1,
      borderColor: '#EADFC4',
    },
    aiBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: HOME_UI.accent,
      letterSpacing: 0.4,
    },
    aiBadgeSpark: {
      color: HOME_UI.goldDeep,
    },
    subtitle: {
      fontSize: 13.5,
      fontWeight: '800',
      color: HOME_UI.accent,
      lineHeight: 18,
      marginBottom: 2,
    },
    bodyText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: tint.fg,
      lineHeight: 15,
    },
    arrow: {
      opacity: 0.65,
    },
  });
}
