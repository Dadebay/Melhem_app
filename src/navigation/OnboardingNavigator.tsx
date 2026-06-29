import {createNativeStackNavigator} from '@react-navigation/native-stack';
import OnboardingLanguageScreen from '../screens/Onboarding/Language';
import OnboardingLocationScreen from '../screens/Onboarding/Location';
import AuthScreen from '../screens/Auth';

const Stack = createNativeStackNavigator<Nav.Onboarding>();

/**
 * First-run flow: Language → Location (both mandatory) → Auth (skippable).
 * Finishing or skipping Auth sets `onboarded`, which swaps the root navigator
 * over to the main tabs (see src/navigation/index.tsx).
 */
const OnboardingNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="OnbLanguage" component={OnboardingLanguageScreen} />
      <Stack.Screen name="OnbLocation" component={OnboardingLocationScreen} />
      <Stack.Screen
        name="Auth"
        component={AuthScreen as any}
        initialParams={{onboarding: true}}
      />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
