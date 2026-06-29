export function getGoogleClientIds() {
  const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';

  return {
    web,
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || web,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || web,
  };
}
