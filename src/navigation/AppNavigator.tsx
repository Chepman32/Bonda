import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableFreeze } from 'react-native-screens';

import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { ContactDetailScreen } from '@/screens/ContactDetailScreen';
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

enableFreeze(true);

const Stack = createNativeStackNavigator<RootStackParamList>();

const dismissableScreenOptions = {
  animation: 'slide_from_bottom' as const,
  fullScreenGestureEnabled: true,
  gestureEnabled: true,
  presentation: 'modal' as const,
};

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
          component={ModeSelectionScreen}
          name={ROUTES.ModeSelection}
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
          component={SessionHistoryScreen}
          name={ROUTES.SessionHistory}
          options={dismissableScreenOptions}
        />
        <Stack.Screen
          component={SettingsScreen}
          name={ROUTES.Settings}
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
          component={PrivacyInfoScreen}
          name={ROUTES.PrivacyInfo}
          options={dismissableScreenOptions}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
