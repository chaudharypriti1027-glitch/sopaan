import 'react-native-gesture-handler';
import { NativeModules, Platform } from 'react-native';
import { installGlobalErrorHandlers } from './src/errors/globalHandlers';
import { initMobileObservability } from './src/observability/sentry';

initMobileObservability();
installGlobalErrorHandlers();

if (Platform.OS !== 'web' && NativeModules.WebRTCModule != null) {
  const { registerGlobals } = require('@livekit/react-native');
  registerGlobals();
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
