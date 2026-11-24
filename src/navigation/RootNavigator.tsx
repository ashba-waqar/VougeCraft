import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { WelcomeScreen, LoginScreen, SignUpScreen } from '../screens/auth';
import { MainTabNavigator } from './MainTabNavigator';
import { TechSheetScreen } from '../screens/studio/TechSheetScreen';
import { Preview3DScreen } from '../screens/studio/Preview3DScreen';
import { PrivacyScreen } from '../screens/legal/Privacy';
import { TermsScreen } from '../screens/legal/Terms';
import {
  getHasSeenOnboarding,
  subscribeHasSeenOnboarding,
} from '../services/onboardingFlag';
import { colors } from '../theme';
import { AuthProvider, useAuth } from '../auth/AuthProvider';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  Onboarding: undefined;
  MainTabs:
    | {
        screen?: string;
        params?: any;
      }
    | undefined;
  TechSheet: { sketchId?: string } | undefined;
  Preview3D: { sketchId?: string } | undefined;
  Privacy: undefined;
  Terms: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootAuthGate: React.FC = () => {
  const { session, isLoading: isAuthLoading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboardingState] = useState(false);
  const [isFlagLoading, setIsFlagLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getHasSeenOnboarding().then((seen) => {
      if (isMounted) {
        setHasSeenOnboardingState(seen);
        setIsFlagLoading(false);
      }
    });

    const unsubscribeFlag = subscribeHasSeenOnboarding((seen) => {
      if (isMounted) {
        setHasSeenOnboardingState(seen);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeFlag();
    };
  }, []);

  if (isAuthLoading || isFlagLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  }

  // Root gate decides in this order:
  // (1) session exists, show Tabs
  // (2) no session and onboarding not yet seen, show Onboarding
  // (3) no session and onboarding seen, show Welcome
  const hasSession = !!session;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {hasSession ? (
          <Stack.Group>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="TechSheet"
              component={TechSheetScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="Preview3D"
              component={Preview3DScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="Privacy"
              component={PrivacyScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Terms"
              component={TermsScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </Stack.Group>
        ) : !hasSeenOnboarding ? (
          <Stack.Group>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Privacy"
              component={PrivacyScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Terms"
              component={TermsScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Privacy"
              component={PrivacyScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Terms"
              component={TermsScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export const RootNavigator: React.FC = () => {
  return (
    <AuthProvider>
      <RootAuthGate />
    </AuthProvider>
  );
};
