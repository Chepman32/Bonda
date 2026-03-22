import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  PermissionIntro: undefined;
  ContactsPermission: undefined;
  ImportNormalize: { usePreview?: boolean } | undefined;
  ModeSelection: undefined;
  EvaluationDeck: undefined;
  ReviewQueue: undefined;
  ClusterEditor: undefined;
  Summary: undefined;
  PersonInsight: { contactId: string };
  SessionHistory: undefined;
  Settings: undefined;
  ExportSnapshot: undefined;
  ContactDetail: { contactId: string };
  PrivacyInfo: undefined;
  ContactGrid: undefined;
  Main: NavigatorScreenParams<Record<string, never>>;
};
