import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { goToLogin } from '../../navigation/goToLogin';
import { PremiumDialog } from './PremiumDialog';
import { registerPremiumDialogBridge } from './premiumDialogBridge';
import { registerSessionExpiredDialog } from './sessionExpiredDialog';
import type {
  PremiumAlertOptions,
  PremiumConfirmOptions,
  PremiumDialogConfig,
} from './premiumDialogTypes';

type PremiumDialogContextValue = {
  show: (config: PremiumDialogConfig) => void;
  confirm: (options: PremiumConfirmOptions) => void;
  alert: (options: PremiumAlertOptions) => void;
  close: () => void;
};

const PremiumDialogContext = createContext<PremiumDialogContextValue | null>(null);

type PremiumDialogProviderProps = {
  children: ReactNode;
};

export function PremiumDialogProvider({ children }: PremiumDialogProviderProps) {
  const { t } = useTranslation(['common', 'settings']);
  const [dialog, setDialog] = useState<PremiumDialogConfig | null>(null);

  const close = useCallback(() => {
    setDialog(null);
  }, []);

  const show = useCallback((config: PremiumDialogConfig) => {
    setDialog({
      ...config,
      actions: config.actions.map((action) => ({
        ...action,
        onPress: () => {
          close();
          action.onPress?.();
        },
      })),
    });
  }, [close]);

  const confirm = useCallback(
    (options: PremiumConfirmOptions) => {
      const isDanger = options.tone === 'danger';
      show({
        title: options.title,
        message: options.message,
        icon: options.icon ?? (isDanger ? 'logout' : 'sparkles'),
        iconTone: isDanger ? 'coral' : 'gold',
        dismissOnBackdrop: true,
        testID: 'premium-confirm-dialog',
        actions: [
          {
            label: options.cancelLabel ?? t('common:cancel'),
            variant: 'ghost',
            testID: 'premium-dialog-cancel',
            onPress: () => {
              close();
              options.onCancel?.();
            },
          },
          {
            label: options.confirmLabel,
            variant: isDanger ? 'danger' : 'gold',
            testID: 'premium-dialog-confirm',
            onPress: () => {
              close();
              options.onConfirm?.();
            },
          },
        ],
      });
    },
    [close, show, t],
  );

  const alert = useCallback(
    (options: PremiumAlertOptions) => {
      show({
        title: options.title,
        message: options.message,
        icon: options.icon ?? 'info',
        iconTone: options.iconTone ?? 'navy',
        dismissOnBackdrop: true,
        testID: 'premium-alert-dialog',
        actions: [
          {
            label: options.confirmLabel ?? t('common:ok'),
            variant: 'gold',
            testID: 'premium-dialog-ok',
            onPress: () => {
              close();
              options.onConfirm?.();
            },
          },
        ],
      });
    },
    [close, show, t],
  );

  const showSessionExpired = useCallback(() => {
    show({
      title: t('common:premiumDialog.sessionExpiredTitle'),
      message: t('common:premiumDialog.sessionExpiredBody'),
      icon: 'session',
      iconTone: 'navy',
      dismissOnBackdrop: false,
      testID: 'premium-session-expired-dialog',
      actions: [
        {
          label: t('common:premiumDialog.signInAgain'),
          variant: 'gold',
          testID: 'premium-dialog-sign-in',
          onPress: () => {
            close();
            goToLogin();
          },
        },
      ],
    });
  }, [close, show, t]);

  useEffect(() => {
    registerPremiumDialogBridge({ show, close });
    return () => registerPremiumDialogBridge(null);
  }, [close, show]);

  useEffect(() => {
    registerSessionExpiredDialog(showSessionExpired);
    return () => registerSessionExpiredDialog(null);
  }, [showSessionExpired]);

  const value = useMemo(
    () => ({
      show,
      confirm,
      alert,
      close,
    }),
    [alert, close, confirm, show],
  );

  return (
    <PremiumDialogContext.Provider value={value}>
      {children}
      {dialog ? (
        <PremiumDialog
          visible
          title={dialog.title}
          message={dialog.message}
          icon={dialog.icon}
          iconTone={dialog.iconTone}
          iconNode={dialog.iconNode}
          actions={dialog.actions}
          dismissOnBackdrop={dialog.dismissOnBackdrop}
          onClose={close}
          testID={dialog.testID}
        />
      ) : null}
    </PremiumDialogContext.Provider>
  );
}

export function usePremiumDialog() {
  const context = useContext(PremiumDialogContext);
  if (!context) {
    throw new Error('usePremiumDialog must be used within PremiumDialogProvider');
  }
  return context;
}
