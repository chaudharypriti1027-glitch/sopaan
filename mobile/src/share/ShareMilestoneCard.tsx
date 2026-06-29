import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { shareCardKindLabel, type ShareCardData } from './types';
import { shareCardTokens as t } from './cardTokens';

type Props = ShareCardData & {
  referralLink?: string;
  referralCode?: string;
};

function ShareLogo({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88">
      <Defs>
        <LinearGradient id="shareGoldGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={t.colors.gold} />
          <Stop offset="1" stopColor={t.colors.goldDeep} />
        </LinearGradient>
      </Defs>
      <Rect x="8" y="8" width="72" height="72" rx="20" fill={t.colors.backgroundAccent} />
      <Path d="M28 58V30h6v22h8V38h6v14h8V26h6v32H28z" fill="url(#shareGoldGrad)" />
      <Path
        d="M24 58h40"
        stroke={t.colors.goldDeep}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ShareMilestoneCard({
  kind,
  userName,
  headline,
  subtitle,
  metrics,
  footerNote,
  referralLink,
  referralCode,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.header}>
        <ShareLogo />
        <View style={styles.brandText}>
          <Text style={styles.brandName}>Sopaan</Text>
          <Text style={styles.eyebrow}>{shareCardKindLabel(kind).toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.headline}>{headline}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.userName}>{userName}</Text>
      </View>

      {metrics.length > 0 ? (
        <View style={styles.metricsRow}>
          {metrics.map((metric) => (
            <View key={metric.label} style={styles.metricTile}>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>
          {footerNote ?? 'Prep smarter for SSC, Banking & UPSC'}
        </Text>
        {referralCode ? (
          <Text style={styles.referralCode}>Use code {referralCode}</Text>
        ) : null}
        {referralLink ? <Text style={styles.referralLink}>{referralLink}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: t.width,
    height: t.height,
    backgroundColor: t.colors.background,
    borderRadius: t.radii['2xl'],
    overflow: 'hidden',
    padding: t.spacing['2xl'],
    justifyContent: 'space-between',
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: t.colors.backgroundAccent,
    opacity: 0.55,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -80,
    left: -30,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: t.colors.goldDeep,
    opacity: 0.12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  brandText: {
    gap: t.spacing.xs / 2,
  },
  brandName: {
    fontSize: t.typography.fontSize.lg,
    lineHeight: t.typography.fontSize.lg * t.typography.lineHeight.tight,
    fontWeight: '700',
    color: t.colors.textPrimary,
    letterSpacing: t.typography.letterSpacing.tight,
  },
  eyebrow: {
    fontSize: t.typography.fontSize.xs,
    lineHeight: t.typography.fontSize.xs * t.typography.lineHeight.normal,
    fontWeight: '600',
    color: t.colors.gold,
    letterSpacing: t.typography.letterSpacing.wide,
  },
  hero: {
    gap: t.spacing.sm,
    paddingVertical: t.spacing.lg,
  },
  headline: {
    fontSize: t.typography.fontSize['5xl'],
    lineHeight: t.typography.fontSize['5xl'] * t.typography.lineHeight.tight,
    fontWeight: '700',
    color: t.colors.gold,
    letterSpacing: t.typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: t.typography.fontSize.md,
    lineHeight: t.typography.fontSize.md * t.typography.lineHeight.snug,
    color: t.colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: t.typography.fontSize.base,
    lineHeight: t.typography.fontSize.base * t.typography.lineHeight.normal,
    color: t.colors.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: t.spacing.sm,
  },
  metricTile: {
    flex: 1,
    backgroundColor: t.colors.surface,
    borderRadius: t.radii.lg,
    padding: t.spacing.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    gap: t.spacing.xs / 2,
  },
  metricValue: {
    fontSize: t.typography.fontSize.xl,
    lineHeight: t.typography.fontSize.xl * t.typography.lineHeight.tight,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  metricLabel: {
    fontSize: t.typography.fontSize.xs,
    lineHeight: t.typography.fontSize.xs * t.typography.lineHeight.normal,
    color: t.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: t.typography.letterSpacing.wide,
  },
  footer: {
    gap: t.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    paddingTop: t.spacing.md,
  },
  footerTitle: {
    fontSize: t.typography.fontSize.sm,
    lineHeight: t.typography.fontSize.sm * t.typography.lineHeight.snug,
    color: t.colors.textSecondary,
    fontWeight: '500',
  },
  referralCode: {
    fontSize: t.typography.fontSize.sm,
    lineHeight: t.typography.fontSize.sm * t.typography.lineHeight.snug,
    color: t.colors.gold,
    fontWeight: '600',
  },
  referralLink: {
    fontSize: t.typography.fontSize.xs,
    lineHeight: t.typography.fontSize.xs * t.typography.lineHeight.normal,
    color: t.colors.textMuted,
  },
});
