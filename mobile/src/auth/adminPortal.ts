import { Platform } from 'react-native';
import { config } from '../config/env';

export class AdminAppAccessError extends Error {
  readonly adminConsoleUrl: string;

  constructor(adminConsoleUrl = getAdminConsoleUrl()) {
    super('Admin accounts must use the admin console, not the student app.');
    this.name = 'AdminAppAccessError';
    this.adminConsoleUrl = adminConsoleUrl;
  }
}

/** Admin console lives on the API server at /admin (not the Expo web dev server). */
export function getAdminConsoleUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:4000/admin`;
    }
  }

  return `${config.apiOrigin}/admin`;
}

export function isAdminProfile(profile: Pick<import('../types/auth').Profile, 'role'> | null | undefined): boolean {
  return profile?.role === 'admin';
}

/** Reject admin users from the student mobile/web app. */
export function assertStudentProfile(profile: import('../types/auth').Profile): void {
  if (isAdminProfile(profile)) {
    throw new AdminAppAccessError();
  }
}

export function openAdminConsole(url = getAdminConsoleUrl()): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer') ?? window.location.assign(url);
    return;
  }

  void import('expo-linking').then((Linking) => Linking.openURL(url));
}

export function isAdminAppAccessError(error: unknown): error is AdminAppAccessError {
  return error instanceof AdminAppAccessError;
}
