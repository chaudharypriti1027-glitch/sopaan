/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  // `config` is the static app.json expo object (Expo merges it automatically).
  const projectId =
    process.env.EAS_PROJECT_ID?.trim() ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
    config.extra?.eas?.projectId?.trim() ||
    '';

  const updatesEnabled = Boolean(projectId);
  const appVersion = config.version ?? '0.1.0';

  return {
    ...config,
    // Bare workflow (android/ present) requires a fixed string, not a policy object.
    runtimeVersion: appVersion,
    updates: updatesEnabled
      ? {
          url: `https://u.expo.dev/${projectId}`,
          enabled: true,
          checkAutomatically: 'ON_LOAD',
          fallbackToCacheTimeout: 0,
        }
      : {
          enabled: false,
        },
    extra: {
      ...(config.extra ?? {}),
      eas: {
        ...(config.extra?.eas ?? {}),
        projectId: projectId || undefined,
      },
    },
    plugins: [...(config.plugins ?? []), 'expo-updates'],
  };
};
