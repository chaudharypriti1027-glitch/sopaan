import type { ReactNode } from 'react';

export type PremiumDialogIcon = 'logout' | 'session' | 'bell' | 'shield' | 'sparkles' | 'info';

export type PremiumDialogTone = 'gold' | 'coral' | 'navy' | 'sage';

export type PremiumDialogActionVariant = 'primary' | 'gold' | 'ghost' | 'danger';

export type PremiumDialogAction = {
  label: string;
  variant?: PremiumDialogActionVariant;
  onPress?: () => void;
  testID?: string;
};

export type PremiumDialogConfig = {
  title: string;
  message?: string;
  icon?: PremiumDialogIcon;
  iconTone?: PremiumDialogTone;
  iconNode?: ReactNode;
  actions: PremiumDialogAction[];
  dismissOnBackdrop?: boolean;
  testID?: string;
};

export type PremiumConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  icon?: PremiumDialogIcon;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export type PremiumAlertOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  icon?: PremiumDialogIcon;
  iconTone?: PremiumDialogTone;
  onConfirm?: () => void;
};
