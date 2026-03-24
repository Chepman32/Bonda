import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type MainTabParamList = {
  ModeSelection: undefined;
  SessionHistory: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  PermissionIntro: undefined;
  ContactsPermission: undefined;
  ImportNormalize: { usePreview?: boolean } | undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  EvaluationDeck: undefined;
  ReviewQueue: undefined;
  ClusterEditor: undefined;
  Summary: undefined;
  PersonInsight: { contactId: string };
  ExportSnapshot: undefined;
  ContactDetail: { contactId: string };
  PrivacyInfo: undefined;
  ContactGrid: undefined;
};

export type TabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;
