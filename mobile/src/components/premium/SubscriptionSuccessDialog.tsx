import { LinearGradient } from 'expo-linear-gradient';
import { Check, Crown, PartyPopper, Sparkles, X } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { PREMIUM } from './premiumStyles';
import { platformShadow } from '../../utils/platformShadow';
import { useTheme } from '../../theme';

export type SubscriptionSuccessDetail = {
  label: string;
  value: string;
};

export type SubscriptionSuccessDialogProps = {
  visible: boolean;
  title: string;
  subtitle: string;
  details: SubscriptionSuccessDetail[];
  perkLabels?: string[];
  badgeLabel?: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  onClose: () => void;
  testID?: string;
};

/** Celebration modal after a successful Pro purchase or free trial. */
export function SubscriptionSuccessDialog({
  visible,
  title,
  subtitle,
  details,
  perkLabels = [],
  badgeLabel,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
  testID = 'subscription-success-dialog',
}: SubscriptionSuccessDialogProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, width), [theme, width]);
  const resolvedBadge = badgeLabel ?? t('premium.successBadge');
  const closeLabel = t('premium.closeDialog');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay} testID={testID}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          style={styles.backdrop}
          onPress={onClose}
        />

        <Animated.View entering={ZoomIn.duration(320)} style={styles.card}>
          <LinearGradient
            colors={[...PREMIUM.heroGradient]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.orbA} pointerEvents="none" />
            <View style={styles.orbB} pointerEvents="none" />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              hitSlop={12}
            >
              <X size={16} color="rgba(255,255,255,0.85)" strokeWidth={2.2} />
            </Pressable>

            <Animated.View entering={FadeIn.delay(80).duration(360)} style={styles.badge}>
              <PartyPopper size={14} color="#251C08" strokeWidth={2.2} />
              <Text style={styles.badgeText}>{resolvedBadge}</Text>
            </Animated.View>

            <Animated.View entering={ZoomIn.delay(60).duration(380)} style={styles.iconRing}>
              <LinearGradient
                colors={[PREMIUM.goldLt, PREMIUM.gold, PREMIUM.goldDeep]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.iconFill}
              >
                <Crown size={30} color="#251C08" strokeWidth={2} fill="#251C08" />
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(360)}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </Animated.View>
          </LinearGradient>

          <View style={styles.body}>
            {details.length > 0 ? (
              <View style={styles.detailsCard}>
                {details.map((detail, index) => (
                  <View key={detail.label}>
                    {index > 0 ? <View style={styles.detailRule} /> : null}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{detail.label}</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {detail.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {perkLabels.length > 0 ? (
              <View style={styles.perks}>
                {perkLabels.map((perk) => (
                  <View key={perk} style={styles.perkRow}>
                    <Check size={14} color={PREMIUM.goldDeep} strokeWidth={2.6} />
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={primaryLabel}
              testID="subscription-success-primary"
              onPress={onPrimary}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            >
              <LinearGradient
                colors={[PREMIUM.goldLt, PREMIUM.gold, PREMIUM.goldDeep]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.primaryFill}
              >
                <Sparkles size={16} color="#251C08" strokeWidth={2.2} />
                <Text style={styles.primaryLabel}>{primaryLabel}</Text>
              </LinearGradient>
            </Pressable>

            {secondaryLabel && onSecondary ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={secondaryLabel}
                testID="subscription-success-secondary"
                onPress={onSecondary}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], windowWidth: number) {
  const cardWidth = Math.min(windowWidth - 36, Platform.OS === 'web' ? 420 : 372);

  return StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(19,26,60,0.62)',
    },
    card: {
      width: cardWidth,
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: '#FFFCF7',
      borderWidth: 1,
      borderColor: PREMIUM.goldBorder,
      ...platformShadow({
        color: '#131A3C',
        offsetY: 24,
        opacity: 0.28,
        radius: 48,
        elevation: 14,
      }),
    },
    hero: {
      paddingTop: 22,
      paddingHorizontal: 22,
      paddingBottom: 26,
      alignItems: 'center',
      overflow: 'hidden',
    },
    orbA: {
      position: 'absolute',
      top: -70,
      right: -50,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(201,162,75,0.28)',
    },
    orbB: {
      position: 'absolute',
      bottom: -80,
      left: -40,
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    closeBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      zIndex: 2,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 99,
      backgroundColor: PREMIUM.goldLt,
      marginBottom: 16,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
      color: '#251C08',
    },
    iconRing: {
      marginBottom: 14,
      ...platformShadow({
        color: PREMIUM.gold,
        offsetY: 10,
        opacity: 0.4,
        radius: 18,
        elevation: 8,
      }),
    },
    iconFill: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      textAlign: 'center',
      fontSize: 24,
      lineHeight: 30,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.4,
      marginBottom: 8,
    },
    subtitle: {
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.72)',
      paddingHorizontal: 8,
    },
    body: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 20,
      gap: 14,
      backgroundColor: PREMIUM.bg,
    },
    detailsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: PREMIUM.hairline,
      ...platformShadow({
        color: PREMIUM.accent,
        offsetY: 6,
        opacity: 0.06,
        radius: 16,
        elevation: 2,
      }),
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 12,
    },
    detailRule: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: PREMIUM.hairline,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: PREMIUM.muted,
      flexShrink: 0,
    },
    detailValue: {
      flex: 1,
      textAlign: 'right',
      fontSize: 13,
      fontWeight: '800',
      color: PREMIUM.ink,
      textTransform: 'capitalize',
    },
    perks: {
      gap: 8,
      paddingHorizontal: 2,
    },
    perkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    perkText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: PREMIUM.ink,
      lineHeight: 18,
    },
    primaryBtn: {
      borderRadius: 99,
      overflow: 'hidden',
      ...platformShadow({
        color: PREMIUM.gold,
        offsetY: 8,
        opacity: 0.35,
        radius: 16,
        elevation: 5,
      }),
    },
    primaryFill: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 18,
    },
    primaryLabel: {
      fontSize: 15,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#251C08',
    },
    secondaryBtn: {
      minHeight: 44,
      borderRadius: 99,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: PREMIUM.goldBorder,
    },
    secondaryLabel: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: PREMIUM.accent,
    },
    pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  });
}
