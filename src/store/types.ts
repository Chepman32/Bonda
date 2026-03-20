import type {
  AnalysisMode,
  AppSettings,
  Cluster,
  ContactEvaluation,
  DiagnosticEvent,
  EvaluationMode,
  EvaluationSession,
  ExportPreset,
  ImportProgress,
  InsightCard,
  NormalizedContact,
} from '@/models/entities';

export type PermissionState = 'idle' | 'denied' | 'restricted' | 'granted';

export interface StoreSlices {
  bootState: 'idle' | 'booting' | 'ready' | 'error';
  permissionState: PermissionState;
  importProgress: ImportProgress;
  selectedMode: EvaluationMode;
  analysisMode: AnalysisMode;
  errorMessage?: string;
  contacts: NormalizedContact[];
  session: EvaluationSession | null;
  evaluations: Record<string, ContactEvaluation>;
  clusters: Cluster[];
  insights: InsightCard[];
  selectedContactId?: string;
  settings: AppSettings;
  history: EvaluationSession[];
  exports: ExportPreset[];
  diagnostics: DiagnosticEvent[];
  reviewQueueIds: string[];
}
