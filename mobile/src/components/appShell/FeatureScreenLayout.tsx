import { useNavigation } from '@react-navigation/native';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { PREMIUM, PremiumPageHeader, PremiumScreen } from '../premium';

type FeatureScreenLayoutProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  rightAction?: ReactNode;
  children: ReactNode;
  contentStyle?: ViewStyle;
  headerFloatCard?: boolean;
  scroll?: boolean;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'style' | 'children'>;
  showBack?: boolean;
};

/**
 * Premium stack screen shell — navy gradient header + cream body.
 * Use on secondary screens (social, learning, prep) for parity with Practice/Home.
 */
export function FeatureScreenLayout({
  title,
  subtitle,
  eyebrow,
  rightAction,
  children,
  contentStyle,
  headerFloatCard = false,
  scroll = true,
  scrollProps,
  showBack = true,
}: FeatureScreenLayoutProps) {
  const navigation = useNavigation();
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleBack =
    showBack && navigation.canGoBack() ? () => navigation.goBack() : undefined;

  return (
    <PremiumScreen scroll={scroll} padded={false} bottomInset="stack" scrollProps={scrollProps}>
      <PremiumPageHeader
        title={title}
        subtitle={subtitle}
        eyebrow={eyebrow}
        rightAction={rightAction}
        onBack={handleBack}
        backA11y={t('back')}
        floatCard={headerFloatCard}
        fullBleed
      />
      <View style={[styles.body, contentStyle]}>{children}</View>
    </PremiumScreen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    body: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: PREMIUM.stackBottomPadding + 8,
      gap: theme.spacing.lg,
    },
  });
}
