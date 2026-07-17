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
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, windowWidth, windowHeight, insets.top, insets.bottom),
    [theme, windowWidth, windowHeight, insets.top, insets.bottom],
  );
  const actionVariantStyles = useMemo(() => getActionVariantStyles(theme), [theme]);
  const Icon = ICON_MAP[icon];
  const gradient = TONE_GRADIENT[iconTone];
  const stacked = true;

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
      presentationStyle="overFullScreen"
      hardwareAccelerated
    >
      <View style={styles.overlay} testID={testID}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
          style={styles.backdrop}
          onPress={handleBackdropPress}
        />
        <View style={styles.centerWrap} pointerEvents="box-none">
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

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.iconWrap}>
                <LinearGradient
                  colors={[...gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconRing}
                >
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

              <View style={[styles.actions, stacked && styles.actionsStacked]}>
                {actions.map((action, index) => (
                  <DialogActionButton
                    key={`${action.label}-${index}`}
                    action={action}
                    stacked={stacked}
                    styles={styles}
                    variantStyles={actionVariantStyles}
                  />
                ))}
              </View>
            </ScrollView>
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
      label: { color: '#FFFFFF' },
    },
    gold: {
      container: {
        backgroundColor: 'transparent',
        borderColor: PREMIUM.goldDeep,
      },
      label: { color: '#251C08' },
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
      label: { color: '#FFFFFF' },
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
          colors={['#E9CF8D', '#C9A24B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionGoldFill}
        />
      ) : null}
      <Text style={[styles.actionLabel, variantStyle.label]} numberOfLines={1}>
        {action.label}
      </Text>
    </Pressable>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  windowWidth: number,
  windowHeight: number,
  insetTop: number,
  insetBottom: number,
) {
  const horizontalPad = 28;
  const maxCard = Platform.OS === 'web' ? 400 : 320;
  const available = Math.max(260, windowWidth - horizontalPad * 2);
  const cardWidth = Math.min(available, maxCard);

  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(26,31,59,0.62)',
    },
    centerWrap: {
      width: cardWidth,
      maxWidth: available,
      maxHeight: Math.max(280, windowHeight - insetTop - insetBottom - 48),
      zIndex: 2,
    },
    card: {
      width: '100%',
      backgroundColor: '#FFFCF7',
      borderRadius: 24,
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
    scrollContent: {
      paddingTop: 28,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    goldRail: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      zIndex: 1,
    },
    closeBtn: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(233,235,243,0.7)',
      zIndex: 3,
    },
    closePressed: { opacity: 0.85 },
    iconWrap: {
      alignSelf: 'center',
      marginBottom: 14,
    },
    iconRing: {
      width: 56,
      height: 56,
      borderRadius: 18,
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
      paddingHorizontal: 12,
      flexShrink: 1,
    },
    message: {
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
      paddingHorizontal: 4,
      flexShrink: 1,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
      width: '100%',
    },
    actionsStacked: {
      flexDirection: 'column',
    },
    actionBtn: {
      minHeight: 48,
      minWidth: 0,
      flexGrow: 1,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      overflow: 'hidden',
      borderWidth: 1,
    },
    actionBtnStacked: {
      width: '100%',
      alignSelf: 'stretch',
    },
    actionGoldFill: {
      ...StyleSheet.absoluteFillObject,
    },
    actionLabel: {
      fontSize: 15,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      zIndex: 1,
      textAlign: 'center',
    },
    actionPressed: { opacity: 0.9 },
  });
}
