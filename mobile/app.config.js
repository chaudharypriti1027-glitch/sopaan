const appJson = require('./app.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = () => {
  const projectId =
    process.env.EAS_PROJECT_ID?.trim() ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
    appJson.expo.extra?.eas?.projectId?.trim() ||
    '';

  const updatesEnabled = Boolean(projectId);
  const appVersion = appJson.expo.version ?? '0.1.0';

  return {
    ...appJson,
    expo: {
      ...appJson.expo,
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
        ...(appJson.expo.extra ?? {}),
        eas: {
          ...(appJson.expo.extra?.eas ?? {}),
          projectId: projectId || undefined,
        },
      },
      plugins: [...(appJson.expo.plugins ?? []), 'expo-updates'],
    },
  };
};
