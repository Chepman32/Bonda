import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { enableFreeze } from 'react-native-screens';
import { Home, History, Settings as SettingsIcon } from 'lucide-react-native';

import { ROUTES } from '@/navigation/routes';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { ContactDetailScreen } from '@/screens/ContactDetailScreen';
import { ContactGridScreen } from '@/screens/ContactGridScreen';
import { ContactsPermissionScreen } from '@/screens/ContactsPermissionScreen';
import { ClusterEditorScreen } from '@/screens/ClusterEditorScreen';
import { EvaluationDeckScreen } from '@/screens/EvaluationDeckScreen';
import { ExportSnapshotScreen } from '@/screens/ExportSnapshotScreen';
import { ImportNormalizeScreen } from '@/screens/ImportNormalizeScreen';
import { ModeSelectionScreen } from '@/screens/ModeSelectionScreen';
import { PermissionIntroScreen } from '@/screens/PermissionIntroScreen';
import { PersonInsightScreen } from '@/screens/PersonInsightScreen';
import { PrivacyInfoScreen } from '@/screens/PrivacyInfoScreen';
import { ReviewQueueScreen } from '@/screens/ReviewQueueScreen';
import { SessionHistoryScreen } from '@/screens/SessionHistoryScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SplashScreen } from '@/screens/SplashScreen';
import { SummaryScreen } from '@/screens/SummaryScreen';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';

enableFreeze(true);

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const dismissableScreenOptions = {
  animation: 'slide_from_bottom' as const,
  fullScreenGestureEnabled: true,
  gestureEnabled: true,
  presentation: 'modal' as const,
};

function MainTabNavigator() {
  const theme = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
      }}
    >
      <Tab.Screen
        name={ROUTES.ModeSelection}
        component={ModeSelectionScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.SessionHistory}
        component={SessionHistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <History color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name={ROUTES.Settings}
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const bootstrapApp = useAppStore(state => state.bootstrapApp);

  useEffect(() => {
    void bootstrapApp();
  }, [bootstrapApp]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={ROUTES.Splash}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen component={SplashScreen} name={ROUTES.Splash} />
        <Stack.Screen
          component={PermissionIntroScreen}
          name={ROUTES.PermissionIntro}
        />
        <Stack.Screen
          component={ContactsPermissionScreen}
          name={ROUTES.ContactsPermission}
        />
        <Stack.Screen
          component={ImportNormalizeScreen}
          name={ROUTES.ImportNormalize}
        />
        <Stack.Screen
          component={MainTabNavigator}
          name={ROUTES.Main}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          component={EvaluationDeckScreen}
          name={ROUTES.EvaluationDeck}
        />
        <Stack.Screen
          component={ReviewQueueScreen}
          name={ROUTES.ReviewQueue}
          options={dismissableScreenOptions}
        />
        <Stack.Screen
          component={ClusterEditorScreen}
          name={ROUTES.ClusterEditor}
          options={dismissableScreenOptions}
        />
        <Stack.Screen component={SummaryScreen} name={ROUTES.Summary} />
        <Stack.Screen
          component={PersonInsightScreen}
          name={ROUTES.PersonInsight}
          options={dismissableScreenOptions}
        />
        <Stack.Screen
          component={ExportSnapshotScreen}
          name={ROUTES.ExportSnapshot}
          options={dismissableScreenOptions}
        />
        <Stack.Screen
          component={ContactDetailScreen}
          name={ROUTES.ContactDetail}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'transparentModal',
            contentStyle: {
              backgroundColor: 'transparent',
            },
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          component={ContactGridScreen}
          name={ROUTES.ContactGrid}
          options={dismissableScreenOptions}
        />
        <Stack.Screen
          component={PrivacyInfoScreen}
          name={ROUTES.PrivacyInfo}
          options={dismissableScreenOptions}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
