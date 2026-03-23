export type ThemeMode = 'system' | 'light' | 'dark' | 'solar' | 'mono';
export type EvaluationMode = 'quick' | 'deep' | 'group' | 'resume';
export type SessionStatus = 'draft' | 'active' | 'paused' | 'completed';
export type ContactSource = 'device' | 'demo';
export type AnalysisMode =
  | 'importance'
  | 'warmth'
  | 'recency'
  | 'support'
  | 'complexity'
  | 'cluster';
export type ReviewBin = 'later' | 'unsure' | 'done';

export type ContactTag =
  | 'family'
  | 'close_friend'
  | 'friend'
  | 'work'
  | 'creative'
  | 'service'
  | 'dormant'
  | 'complicated'
  | 'supportive'
  | 'aspirational'
  | 'mentor'
  | 'inner_circle';

export interface ContactIdentity {
  id: string;
  externalId: string;
  source: ContactSource;
}

export interface NormalizedContact extends ContactIdentity {
  givenName: string;
  familyName: string;
  displayName: string;
  sortName: string;
  company?: string;
  jobTitle?: string;
  avatarUri?: string;
  avatarSeed: string;
  initials: string;
  phoneNumbers: string[];
  emailAddresses: string[];
  notes?: string;
  hasName: boolean;
  relationConfidence: number;
  inferredGroup?: ContactTag;
  lastModifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipScores {
  importance: number;
  comfort: number;
  activity: number;
  futureAttention: number;
  stability: number;
  complexity: number;
  supportiveness: number;
  professionalValue: number;
  emotionalWeight: number;
}

export interface ContactEvaluation {
  id: string;
  sessionId: string;
  contactId: string;
  scores: RelationshipScores;
  tags: ContactTag[];
  clusterId?: string;
  confidence: number;
  skipped: boolean;
  reviewBin?: ReviewBin;
  note?: string;
  revisit: boolean;
  pinnedToCore: boolean;
  markedDormant: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationSession {
  id: string;
  mode: EvaluationMode;
  status: SessionStatus;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  importedCount: number;
  deduplicatedCount: number;
  hiddenCount: number;
  readyCount: number;
  processedCount: number;
  skippedCount: number;
  source: ContactSource;
}

export interface Cluster {
  id: string;
  name: string;
  color: string;
  kind: ContactTag | 'custom';
  contactIds: string[];
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsightCard {
  id: string;
  title: string;
  metric: string;
  description: string;
  actionLabel?: string;
  relatedContactIds: string[];
  visualization:
    | 'orbits'
    | 'density'
    | 'spectrum'
    | 'timeline'
    | 'constellation';
}

export interface ExportPreset {
  id: string;
  type: 'poster' | 'stats' | 'loop' | 'pdf';
  title: string;
  hideNames: boolean;
  createdAt: string;
  filePath?: string;
}

export interface AppSettings {
  themeMode: ThemeMode;
  reducedMotion: boolean;
  hapticsIntensity: 'off' | 'soft' | 'standard';
  hideNamelessContacts: boolean;
  hideOneWayContacts: boolean;
  defaultEvaluationMode: EvaluationMode;
  exportHideNames: boolean;
  diagnosticsEnabled: boolean;
  hasCompletedOnboarding: boolean;
  preferBiometricUnlock: boolean;
  lastSessionId?: string;
}

export interface DiagnosticEvent {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  createdAt: string;
}

export interface ImportProgress {
  imported: number;
  deduplicated: number;
  hidden: number;
  ready: number;
  total: number;
  stage:
    | 'idle'
    | 'checkingPermission'
    | 'readingContacts'
    | 'normalizing'
    | 'persisting'
    | 'complete'
    | 'error';
}

export interface SummaryMetrics {
  coreScore: number;
  warmth: number;
  neglect: number;
  concentration: number;
  workSplit: number;
  supportDensity: number;
  emotionalBalance: number;
  stability: number;
}

export interface BubbleNode {
  id: string;
  label: string;
  radius: number;
  orbit: number;
  angle: number;
  color: string;
  glow: number;
  clusterId?: string;
}
