const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const defaultConfig = getDefaultConfig(projectRoot);
const config = getSentryExpoConfig(projectRoot);

config.watchFolders = [...new Set([...defaultConfig.watchFolders, workspaceRoot])];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// zustand's ESM build uses `import.meta`, which Metro does not transpile and
// which throws a SyntaxError in the browser, blanking the whole web app.
// Pin zustand imports to its CommonJS files instead.
const fs = require('fs');
const zustandRoot = fs.existsSync(path.resolve(projectRoot, 'node_modules/zustand'))
  ? path.resolve(projectRoot, 'node_modules/zustand')
  : path.resolve(workspaceRoot, 'node_modules/zustand');

const baseResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    const subpath = moduleName === 'zustand' ? 'index' : moduleName.slice('zustand/'.length);
    const filePath = path.join(zustandRoot, `${subpath}.js`);
    if (fs.existsSync(filePath)) {
      return { type: 'sourceFile', filePath };
    }
  }
  return baseResolveRequest
    ? baseResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
