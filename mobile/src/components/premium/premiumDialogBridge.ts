import type { PremiumDialogConfig } from './premiumDialogTypes';

type PremiumDialogBridge = {
  show: (config: PremiumDialogConfig) => void;
  close: () => void;
};

let bridge: PremiumDialogBridge | null = null;

export function registerPremiumDialogBridge(next: PremiumDialogBridge | null) {
  bridge = next;
}

export function showPremiumDialog(config: PremiumDialogConfig) {
  bridge?.show(config);
}

export function closePremiumDialog() {
  bridge?.close();
}
