import { useMemo, type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { PREMIUM } from './premium/premiumStyles';

export type PremiumHeroStat = {
  label: string;
  value: string;
};

type PremiumHeroCardProps = {
  /** Small rendered icon element, e.g. <Trophy size={24} color="#FFF" />. */
  icon: ReactNode;
  /** Gradient used behind the icon tile. Defaults to gold. */
  iconGradient?: readonly [string, string];
  eyebrow: string;
  title: string;
  /** Optional element rendered top-right of the title row, e.g. a rank badge. */
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
  iconGradient = ['#D8B368', PREMIUM.gold],
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
      <View style={[styles.blob, styles.blobA]} />
      <View style={[styles.blob, styles.blobB]} />

      <View style={styles.top}>
        <LinearGradient
          colors={[...iconGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconTile}
        >
          {icon}
        </LinearGradient>
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
    blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(194,154,78,0.2)' },
    blobA: { top: -50, right: -50, width: 190, height: 190 },
    blobB: { bottom: -30, left: -20, width: 130, height: 130 },
    top: { flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 1 },
    iconTile: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
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
    statCell: { flex: 1, flexDirection: 'row', alignItems: 'center' },
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
