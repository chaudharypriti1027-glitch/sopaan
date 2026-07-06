import { useMemo, type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { PREMIUM } from './premium/premiumStyles';

export type PremiumHeroStat = {
  label: string;
  value: string;
};

type PremiumHeroCardProps = {
  /** Pre-built 3D icon tile (HomePremiumIcon / HomeSlotIcon). */
  icon: ReactNode;
  eyebrow: string;
  title: string;
  trailing?: ReactNode;
  stats?: PremiumHeroStat[];
  hint?: string;
  children?: ReactNode;
  gradient?: readonly [string, string, string];
  style?: StyleProp<ViewStyle>;
};

/** Navy/gold gradient hero card — shared "Classic Premium" summary surface. */
export function PremiumHeroCard({
  icon,
  eyebrow,
  title,
  trailing,
  stats,
  hint,
  children,
  gradient = PREMIUM.heroGradient,
  style,
}: PremiumHeroCardProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <LinearGradient
      colors={[...gradient]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.card, style]}
    >
      <View style={styles.meshLineA} />
      <View style={styles.meshLineB} />
      <View style={styles.goldGlow} pointerEvents="none" />

      <View style={styles.top}>
        <View style={styles.iconSlot}>{icon}</View>
        <View style={styles.info}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {trailing}
      </View>

      {stats && stats.length > 0 ? (
        <View style={styles.statsRow}>
          {stats.flatMap((stat, index) => [
            index > 0 ? <View key={`${stat.label}-divider`} style={styles.divider} /> : null,
            <View key={stat.label} style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>,
          ])}
        </View>
      ) : null}

      {children}

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </LinearGradient>
  );
}

function createStyles() {
  return StyleSheet.create({
    card: {
      borderRadius: PREMIUM.cardRadius,
      paddingVertical: 20,
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
      overflow: 'hidden',
      shadowColor: PREMIUM.accent,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 36,
      elevation: 6,
      gap: 16,
    },
    meshLineA: {
      position: 'absolute',
      top: 24,
      left: -20,
      right: -20,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.05)',
      transform: [{ rotate: '-4deg' }],
    },
    meshLineB: {
      position: 'absolute',
      bottom: 40,
      left: -20,
      right: -20,
      height: 1,
      backgroundColor: 'rgba(194,154,78,0.12)',
      transform: [{ rotate: '3deg' }],
    },
    goldGlow: {
      position: 'absolute',
      top: -36,
      right: -28,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(194,154,78,0.18)',
    },
    top: { flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 1 },
    iconSlot: { flexShrink: 0 },
    info: { flex: 1, gap: 3 },
    eyebrow: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.55)',
    },
    title: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      borderRadius: 16,
      paddingVertical: 14,
      zIndex: 1,
    },
    divider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: 'rgba(255,255,255,0.14)', marginRight: 0 },
    stat: { flex: 1, alignItems: 'center', gap: 3 },
    statValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    statLabel: { fontSize: 10.5, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
    hint: {
      fontSize: 12.5,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.65)',
      textAlign: 'center',
      zIndex: 1,
    },
  });
}
