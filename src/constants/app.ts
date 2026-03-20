import type {
  AppSettings,
  ContactTag,
  EvaluationMode,
  RelationshipScores,
} from '@/models/entities';

export const ROUTES = {
  Splash: 'Splash',
  PermissionIntro: 'PermissionIntro',
  ContactsPermission: 'ContactsPermission',
  ImportNormalize: 'ImportNormalize',
  ModeSelection: 'ModeSelection',
  EvaluationDeck: 'EvaluationDeck',
  ReviewQueue: 'ReviewQueue',
  ClusterEditor: 'ClusterEditor',
  Summary: 'Summary',
  PersonInsight: 'PersonInsight',
  SessionHistory: 'SessionHistory',
  Settings: 'Settings',
  ExportSnapshot: 'ExportSnapshot',
  ContactDetail: 'ContactDetail',
  PrivacyInfo: 'PrivacyInfo',
} as const;

export const CONTACT_TAGS: Array<{
  value: ContactTag;
  icon: string;
}> = [
  { value: 'family', icon: 'HeartHandshake' },
  { value: 'close_friend', icon: 'Sparkles' },
  { value: 'friend', icon: 'Users' },
  { value: 'work', icon: 'BriefcaseBusiness' },
  { value: 'creative', icon: 'Palette' },
  { value: 'service', icon: 'ShieldCheck' },
  { value: 'dormant', icon: 'MoonStar' },
  { value: 'complicated', icon: 'Orbit' },
  { value: 'supportive', icon: 'LifeBuoy' },
  { value: 'aspirational', icon: 'Compass' },
  { value: 'mentor', icon: 'GraduationCap' },
  { value: 'inner_circle', icon: 'CircleDot' },
];

export const EVALUATION_MODES: Array<{
  id: EvaluationMode;
  titleKey: string;
  bodyKey: string;
}> = [
  {
    id: 'quick',
    titleKey: 'mode.quick.title',
    bodyKey: 'mode.quick.body',
  },
  {
    id: 'deep',
    titleKey: 'mode.deep.title',
    bodyKey: 'mode.deep.body',
  },
  {
    id: 'group',
    titleKey: 'mode.group.title',
    bodyKey: 'mode.group.body',
  },
  {
    id: 'resume',
    titleKey: 'mode.resume.title',
    bodyKey: 'mode.resume.body',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  reducedMotion: false,
  hapticsIntensity: 'standard',
  hideNamelessContacts: false,
  hideOneWayContacts: false,
  defaultEvaluationMode: 'quick',
  exportHideNames: true,
  diagnosticsEnabled: true,
  hasCompletedOnboarding: false,
  preferBiometricUnlock: false,
};

export const DEFAULT_SCORES: RelationshipScores = {
  importance: 50,
  comfort: 50,
  activity: 50,
  futureAttention: 50,
  stability: 0,
  complexity: 0,
  supportiveness: 0,
  professionalValue: 0,
  emotionalWeight: 0,
};

export const SCORE_WEIGHTS = {
  coreScore: {
    importance: 0.35,
    comfort: 0.3,
    activity: 0.2,
    futureAttention: 0.15,
  },
  warmth: {
    comfort: 0.6,
    supportiveness: 0.4,
  },
};

export const DATABASE_NAME = 'bonda.db';
export const MMKV_ID = 'bonda.secure.storage';
export const MMKV_SERVICE = 'com.bonda.storage.key';
export const DIAGNOSTICS_LOG_FILE = 'bonda-diagnostics.jsonl';
export const MAX_DIAGNOSTIC_EVENTS = 300;

export const SCORE_LIMITS = {
  baseMin: 0,
  baseMax: 100,
  modifierMin: -50,
  modifierMax: 50,
  confidenceMin: 0.5,
  confidenceMax: 1.5,
};
