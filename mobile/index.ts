import 'react-native-gesture-handler';
import { installGlobalErrorHandlers } from './src/errors/globalHandlers';
import { initMobileObservability } from './src/observability/sentry';

initMobileObservability();
installGlobalErrorHandlers();

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
