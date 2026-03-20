import {
  buildClusters,
  moveContactBetweenClusters,
} from '@/services/clusteringService';
import { getPersistenceAdapter } from '@/services/persistence/adapter';
import type {
  Cluster,
  ContactEvaluation,
  DiagnosticEvent,
  EvaluationMode,
  EvaluationSession,
  ExportPreset,
  ImportProgress,
  NormalizedContact,
} from '@/models/entities';
import { createId } from '@/utils/ids';

export class DataRepository {
  private async adapter() {
    return getPersistenceAdapter();
  }

  public async replaceContacts(contacts: NormalizedContact[]): Promise<void> {
    const adapter = await this.adapter();
    await adapter.initialize();
    await adapter.replaceContacts(contacts);
  }

  public async listContacts(): Promise<NormalizedContact[]> {
    const adapter = await this.adapter();
    await adapter.initialize();
    return adapter.listContacts();
  }

  public async createSession(input: {
    mode: EvaluationMode;
    source: EvaluationSession['source'];
    progress: ImportProgress;
  }): Promise<EvaluationSession> {
    const session: EvaluationSession = {
      id: createId(),
      mode: input.mode,
      status: 'active',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importedCount: input.progress.imported,
      deduplicatedCount: input.progress.deduplicated,
      hiddenCount: input.progress.hidden,
      readyCount: input.progress.ready,
      processedCount: 0,
      skippedCount: 0,
      source: input.source,
    };
    const adapter = await this.adapter();
    await adapter.saveSession(session);
    return session;
  }

  public async saveSession(session: EvaluationSession): Promise<void> {
    const adapter = await this.adapter();
    await adapter.saveSession(session);
  }

  public async getSession(
    sessionId: string,
  ): Promise<EvaluationSession | undefined> {
    const adapter = await this.adapter();
    return adapter.getSession(sessionId);
  }

  public async listSessions(): Promise<EvaluationSession[]> {
    const adapter = await this.adapter();
    return adapter.listSessions();
  }

  public async saveEvaluation(evaluation: ContactEvaluation): Promise<void> {
    const adapter = await this.adapter();
    await adapter.saveEvaluation(evaluation);
  }

  public async listEvaluations(
    sessionId?: string,
  ): Promise<ContactEvaluation[]> {
    const adapter = await this.adapter();
    return adapter.listEvaluations(sessionId);
  }

  public async deleteEvaluation(evaluationId: string): Promise<void> {
    const adapter = await this.adapter();
    await adapter.deleteEvaluation(evaluationId);
  }

  public async syncClusters(
    contacts: NormalizedContact[],
    evaluations: ContactEvaluation[],
  ): Promise<Cluster[]> {
    const clusters = buildClusters(contacts, evaluations);
    const adapter = await this.adapter();
    await adapter.replaceClusters(clusters);
    return clusters;
  }

  public async listClusters(): Promise<Cluster[]> {
    const adapter = await this.adapter();
    return adapter.listClusters();
  }

  public async moveContactCluster(
    contactId: string,
    nextClusterId: string,
  ): Promise<Cluster[]> {
    const adapter = await this.adapter();
    const currentClusters = await adapter.listClusters();
    const nextClusters = moveContactBetweenClusters(
      currentClusters,
      contactId,
      nextClusterId,
    );
    await adapter.replaceClusters(nextClusters);
    return nextClusters;
  }

  public async saveExport(preset: ExportPreset): Promise<void> {
    const adapter = await this.adapter();
    await adapter.saveExport(preset);
  }

  public async listExports(): Promise<ExportPreset[]> {
    const adapter = await this.adapter();
    return adapter.listExports();
  }

  public async saveDiagnostic(event: DiagnosticEvent): Promise<void> {
    const adapter = await this.adapter();
    await adapter.saveDiagnostic(event);
  }

  public async listDiagnostics(limit: number): Promise<DiagnosticEvent[]> {
    const adapter = await this.adapter();
    return adapter.listDiagnostics(limit);
  }

  public async clearAll(): Promise<void> {
    const adapter = await this.adapter();
    await adapter.clearAll();
  }
}

let repositoryInstance: DataRepository | undefined;

export function getDataRepository(): DataRepository {
  repositoryInstance ??= new DataRepository();
  return repositoryInstance;
}
