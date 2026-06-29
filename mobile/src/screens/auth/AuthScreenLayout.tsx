import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components';
import { useTheme } from '../../theme';

type AuthScreenLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  footer?: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export function AuthScreenLayout({
  children,
  title,
  subtitle,
  showBack = false,
  footer,
  scroll = true,
  contentStyle: contentStyleProp,
}: AuthScreenLayoutProps) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const contentStyle = useMemo(
    () => StyleSheet.flatten([styles.content, contentStyleProp]),
    [styles.content, contentStyleProp],
  );

  return (
    <Screen scroll={scroll} contentContainerStyle={contentStyle}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('layout.goBackA11y')}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={22} color={theme.colors.text.primary} />
        </Pressable>
      ) : null}

      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.body}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      paddingBottom: theme.spacing['3xl'],
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface.default,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
      shadowOpacity: 0.04,
    },
    title: {
      ...theme.typography.presets.h1,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xl,
    },
    body: {
      flex: 1,
      gap: theme.spacing.lg,
    },
    footer: {
      marginTop: theme.spacing.xl,
      gap: theme.spacing.md,
    },
  });
}
