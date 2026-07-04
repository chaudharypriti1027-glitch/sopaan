import { Platform } from 'react-native';

/** Android/iOS only — `importantForAccessibility` is invalid on DOM/web. */
export function noHideDescendantsA11y() {
  if (Platform.OS === 'web') {
    return {};
  }
  return { importantForAccessibility: 'no-hide-descendants' as const };
}

export function noA11yA11y() {
  if (Platform.OS === 'web') {
    return {};
  }
  return { importantForAccessibility: 'no' as const };
}
