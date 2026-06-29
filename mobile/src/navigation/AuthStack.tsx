import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingProvider } from '../auth/OnboardingContext';
import { LoginScreen } from '../screens/LoginScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { SignupScreen } from '../screens/SignupScreen';
import {
  GoalSetupScreen,
  OnboardingScreen,
  OtpLoginScreen,
} from '../screens/auth';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <OnboardingProvider>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="GoalSetup" component={GoalSetupScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="OtpLogin" component={OtpLoginScreen} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
