import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Info,
  LogIn,
  LogOut,
  Shield,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, type ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../Text';
import { PREMIUM } from './premiumStyles';
import { platformShadow } from '../../utils/platformShadow';
import type {
  PremiumDialogAction,
  PremiumDialogActionVariant,
  PremiumDialogIcon,
  PremiumDialogTone,
} from './premiumDialogTypes';
import { useTheme } from '../../theme';

const ICON_MAP: Record<PremiumDialogIcon, LucideIcon> = {
  logout: LogOut,
  session: LogIn,
  bell: Bell,
  shield: Shield,
  sparkles: Sparkles,
  info: Info,
};

const TONE_GRADIENT: Record<PremiumDialogTone, readonly [string, string]> = {
  gold: ['#E3C97F', '#C29A4E'],
  coral: ['#F5A8A0', '#E57373'],
  navy: ['#3D4678', '#232A4D'],
  sage: ['#7BA896', '#5F8A7B'],
};

type PremiumDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  icon?: PremiumDialogIcon;
  iconTone?: PremiumDialogTone;
  iconNode?: ReactNode;
  actions: PremiumDialogAction[];
  dismissOnBackdrop?: boolean;
  onClose: () => void;
  testID?: string;
};

export function PremiumDialog({
  visible,
  title,
  message,
  icon = 'sparkles',
  iconTone = 'gold',
  iconNode,
  actions,
  dismissOnBackdrop = true,
  onClose,
  testID = 'premium-dialog',
}: PremiumDialogProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, width), [theme, width]);
  const actionVariantStyles = useMemo(() => getActionVariantStyles(theme), [theme]);
  const Icon = ICON_MAP[icon];
  const gradient = TONE_GRADIENT[iconTone];

  const handleBackdropPress = () => {
    if (dismissOnBackdrop) {
      onClose();
    }
  };

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
          accessibilityLabel="Close dialog"
          style={styles.backdrop}
          onPress={handleBackdropPress}
        />
        <View style={styles.card} accessibilityViewIsModal>
          <LinearGradient
            colors={['#E3C97F', '#C29A4E', '#A67C33']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.goldRail}
          />

          {dismissOnBackdrop ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closePressed]}
              hitSlop={12}
            >
              <X size={18} color={theme.colors.text.tertiary} strokeWidth={2} />
            </Pressable>
          ) : null}

          <View style={styles.iconWrap}>
            <LinearGradient colors={[...gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconRing}>
              {iconNode ?? <Icon size={26} color="#FFFFFF" strokeWidth={1.9} />}
            </LinearGradient>
          </View>

          <Text variant="h3" style={styles.title}>
            {title}
          </Text>
          {message ? (
            <Text variant="bodyMedium" color="secondary" style={styles.message}>
              {message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {actions.map((action, index) => (
              <DialogActionButton
                key={`${action.label}-${index}`}
                action={action}
                stacked={actions.length > 2 || width < 360}
                styles={styles}
                variantStyles={actionVariantStyles}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

type DialogStyles = ReturnType<typeof createStyles>;
type ActionVariantStyles = Record<
  PremiumDialogActionVariant,
  { container: object; label: object }
>;

function getActionVariantStyles(theme: ReturnType<typeof useTheme>['theme']): ActionVariantStyles {
  return {
    primary: {
      container: {
        backgroundColor: PREMIUM.accent,
        borderColor: PREMIUM.accent,
      },
      label: {},
    },
    gold: {
      container: {
        backgroundColor: 'transparent',
        borderColor: PREMIUM.gold,
      },
      label: { color: PREMIUM.goldDeep },
    },
    ghost: {
      container: {
        backgroundColor: 'rgba(233,235,243,0.65)',
        borderColor: 'rgba(35,42,77,0.12)',
      },
      label: { color: theme.colors.brand.primary },
    },
    danger: {
      container: {
        backgroundColor: theme.colors.semantic.error,
        borderColor: theme.colors.semantic.error,
      },
      label: {},
    },
  };
}

type DialogActionButtonProps = {
  action: PremiumDialogAction;
  stacked: boolean;
  styles: DialogStyles;
  variantStyles: ActionVariantStyles;
};

function DialogActionButton({ action, stacked, styles, variantStyles }: DialogActionButtonProps) {
  const variant = action.variant ?? 'primary';
  const variantStyle = variantStyles[variant];
  const labelColor =
    variant === 'ghost'
      ? undefined
      : variant === 'danger'
        ? '#FFFFFF'
        : variant === 'gold'
          ? PREMIUM.goldDeep
          : '#FFFFFF';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      testID={action.testID}
      onPress={action.onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        stacked && styles.actionBtnStacked,
        variantStyle.container,
        pressed && styles.actionPressed,
      ]}
    >
      {variant === 'gold' ? (
        <LinearGradient
          colors={['#D8B368', PREMIUM.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionGoldFill}
        />
      ) : null}
      <Text style={[styles.actionLabel, labelColor ? { color: labelColor } : null, variantStyle.label]}>
        {action.label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], windowWidth: number) {
  const cardWidth = Math.min(windowWidth - 40, Platform.OS === 'web' ? 420 : 360);

  return StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(26,31,59,0.58)',
    },
    card: {
      width: cardWidth,
      backgroundColor: '#FFFCF7',
      borderRadius: 24,
      paddingTop: 28,
      paddingHorizontal: 22,
      paddingBottom: 22,
      borderWidth: 1,
      borderColor: 'rgba(234,223,196,0.85)',
      overflow: 'hidden',
      ...platformShadow({
        color: '#1A1F3B',
        offsetY: 20,
        opacity: 0.22,
        radius: 40,
        elevation: 12,
      }),
    },
    goldRail: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
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
      backgroundColor: 'rgba(233,235,243,0.7)',
      zIndex: 2,
    },
    closePressed: { opacity: 0.85 },
    iconWrap: {
      alignSelf: 'center',
      marginBottom: 16,
    },
    iconRing: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      ...platformShadow({
        color: PREMIUM.gold,
        offsetY: 8,
        opacity: 0.35,
        radius: 16,
        elevation: 6,
      }),
    },
    title: {
      textAlign: 'center',
      color: PREMIUM.ink,
      marginBottom: 8,
    },
    message: {
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 22,
      paddingHorizontal: 4,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
    },
    actionBtn: {
      minHeight: 46,
      minWidth: 120,
      flexGrow: 1,
      flexBasis: '40%',
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      overflow: 'hidden',
      borderWidth: 1,
    },
    actionBtnStacked: {
      flexBasis: '100%',
    },
    actionGoldFill: {
      ...StyleSheet.absoluteFillObject,
    },
    actionLabel: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      zIndex: 1,
    },
    actionPressed: { opacity: 0.9 },
  });
}
