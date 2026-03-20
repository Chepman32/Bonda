import {
  NitroSQLite,
  type NitroSQLiteConnection,
} from 'react-native-nitro-sqlite';

import { DATABASE_NAME } from '@/constants/app';
import type {
  Cluster,
  ContactEvaluation,
  DiagnosticEvent,
  EvaluationSession,
  ExportPreset,
  NormalizedContact,
} from '@/models/entities';

interface PersistenceAdapter {
  initialize(): Promise<void>;
  replaceContacts(contacts: NormalizedContact[]): Promise<void>;
  listContacts(): Promise<NormalizedContact[]>;
  saveSession(session: EvaluationSession): Promise<void>;
  listSessions(): Promise<EvaluationSession[]>;
  getSession(sessionId: string): Promise<EvaluationSession | undefined>;
  saveEvaluation(evaluation: ContactEvaluation): Promise<void>;
  listEvaluations(sessionId?: string): Promise<ContactEvaluation[]>;
  deleteEvaluation(evaluationId: string): Promise<void>;
  replaceClusters(clusters: Cluster[]): Promise<void>;
  listClusters(): Promise<Cluster[]>;
  saveExport(preset: ExportPreset): Promise<void>;
  listExports(): Promise<ExportPreset[]>;
  saveDiagnostic(event: DiagnosticEvent): Promise<void>;
  listDiagnostics(limit: number): Promise<DiagnosticEvent[]>;
  clearAll(): Promise<void>;
}

function isTestEnvironment(): boolean {
  return (
    typeof jest !== 'undefined' ||
    global.process?.env?.JEST_WORKER_ID !== undefined
  );
}

class MemoryPersistenceAdapter implements PersistenceAdapter {
  private contacts = new Map<string, NormalizedContact>();
  private sessions = new Map<string, EvaluationSession>();
  private evaluations = new Map<string, ContactEvaluation>();
  private clusters = new Map<string, Cluster>();
  private exports = new Map<string, ExportPreset>();
  private diagnostics = new Map<string, DiagnosticEvent>();

  public async initialize(): Promise<void> {}

  public async replaceContacts(contacts: NormalizedContact[]): Promise<void> {
    this.contacts = new Map(contacts.map(contact => [contact.id, contact]));
  }

  public async listContacts(): Promise<NormalizedContact[]> {
    return [...this.contacts.values()];
  }

  public async saveSession(session: EvaluationSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  public async listSessions(): Promise<EvaluationSession[]> {
    return [...this.sessions.values()].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  public async getSession(
    sessionId: string,
  ): Promise<EvaluationSession | undefined> {
    return this.sessions.get(sessionId);
  }

  public async saveEvaluation(evaluation: ContactEvaluation): Promise<void> {
    this.evaluations.set(evaluation.id, evaluation);
  }

  public async listEvaluations(
    sessionId?: string,
  ): Promise<ContactEvaluation[]> {
    return [...this.evaluations.values()].filter(evaluation =>
      sessionId ? evaluation.sessionId === sessionId : true,
    );
  }

  public async deleteEvaluation(evaluationId: string): Promise<void> {
    this.evaluations.delete(evaluationId);
  }

  public async replaceClusters(clusters: Cluster[]): Promise<void> {
    this.clusters = new Map(clusters.map(cluster => [cluster.id, cluster]));
  }

  public async listClusters(): Promise<Cluster[]> {
    return [...this.clusters.values()];
  }

  public async saveExport(preset: ExportPreset): Promise<void> {
    this.exports.set(preset.id, preset);
  }

  public async listExports(): Promise<ExportPreset[]> {
    return [...this.exports.values()].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  public async saveDiagnostic(event: DiagnosticEvent): Promise<void> {
    this.diagnostics.set(event.id, event);
  }

  public async listDiagnostics(limit: number): Promise<DiagnosticEvent[]> {
    return [...this.diagnostics.values()]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  public async clearAll(): Promise<void> {
    this.contacts.clear();
    this.sessions.clear();
    this.evaluations.clear();
    this.clusters.clear();
    this.exports.clear();
    this.diagnostics.clear();
  }
}

class SQLitePersistenceAdapter implements PersistenceAdapter {
  private db?: NitroSQLiteConnection;

  private async connect(): Promise<NitroSQLiteConnection> {
    if (this.db) {
      return this.db;
    }

    this.db = NitroSQLite.open({
      name: DATABASE_NAME,
      location: 'default',
    });

    return this.db;
  }

  public async initialize(): Promise<void> {
    const db = await this.connect();

    await db.executeBatchAsync([
      {
        query: `CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY NOT NULL,
          external_id TEXT NOT NULL,
          source TEXT NOT NULL,
          given_name TEXT NOT NULL,
          family_name TEXT NOT NULL,
          display_name TEXT NOT NULL,
          sort_name TEXT NOT NULL,
          company TEXT,
          job_title TEXT,
          avatar_uri TEXT,
          avatar_seed TEXT NOT NULL,
          initials TEXT NOT NULL,
          notes TEXT,
          has_name INTEGER NOT NULL,
          relation_confidence REAL NOT NULL,
          inferred_group TEXT,
          last_modified_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS contact_methods (
          id TEXT PRIMARY KEY NOT NULL,
          contact_id TEXT NOT NULL,
          method_type TEXT NOT NULL,
          value TEXT NOT NULL,
          FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY NOT NULL,
          mode TEXT NOT NULL,
          status TEXT NOT NULL,
          started_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          completed_at TEXT,
          imported_count INTEGER NOT NULL,
          deduplicated_count INTEGER NOT NULL,
          hidden_count INTEGER NOT NULL,
          ready_count INTEGER NOT NULL,
          processed_count INTEGER NOT NULL,
          skipped_count INTEGER NOT NULL,
          source TEXT NOT NULL
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS evaluations (
          id TEXT PRIMARY KEY NOT NULL,
          session_id TEXT NOT NULL,
          contact_id TEXT NOT NULL,
          importance REAL NOT NULL,
          comfort REAL NOT NULL,
          activity REAL NOT NULL,
          future_attention REAL NOT NULL,
          stability REAL NOT NULL,
          complexity REAL NOT NULL,
          supportiveness REAL NOT NULL,
          professional_value REAL NOT NULL,
          emotional_weight REAL NOT NULL,
          confidence REAL NOT NULL,
          cluster_id TEXT,
          skipped INTEGER NOT NULL,
          review_bin TEXT,
          revisit INTEGER NOT NULL,
          pinned_to_core INTEGER NOT NULL,
          marked_dormant INTEGER NOT NULL,
          tags TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS session_contact_state (
          id TEXT PRIMARY KEY NOT NULL,
          session_id TEXT NOT NULL,
          contact_id TEXT NOT NULL,
          evaluation_id TEXT NOT NULL,
          confidence REAL NOT NULL,
          skipped INTEGER NOT NULL,
          review_bin TEXT,
          updated_at TEXT NOT NULL
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS clusters (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          kind TEXT NOT NULL,
          locked INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS cluster_members (
          id TEXT PRIMARY KEY NOT NULL,
          cluster_id TEXT NOT NULL,
          contact_id TEXT NOT NULL
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS notes (
          contact_id TEXT PRIMARY KEY NOT NULL,
          content TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS exports (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          hide_names INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          file_path TEXT
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS diagnostic_events (
          id TEXT PRIMARY KEY NOT NULL,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          context TEXT,
          created_at TEXT NOT NULL
        )`,
      },
    ]);
  }

  public async replaceContacts(contacts: NormalizedContact[]): Promise<void> {
    const db = await this.connect();

    await db.transaction(async tx => {
      await tx.executeAsync('DELETE FROM contact_methods');
      await tx.executeAsync('DELETE FROM contacts');

      for (const contact of contacts) {
        await tx.executeAsync(
          `INSERT INTO contacts (
            id, external_id, source, given_name, family_name, display_name,
            sort_name, company, job_title, avatar_uri, avatar_seed, initials,
            notes, has_name, relation_confidence, inferred_group, last_modified_at,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            contact.id,
            contact.externalId,
            contact.source,
            contact.givenName,
            contact.familyName,
            contact.displayName,
            contact.sortName,
            contact.company ?? null,
            contact.jobTitle ?? null,
            contact.avatarUri ?? null,
            contact.avatarSeed,
            contact.initials,
            contact.notes ?? null,
            contact.hasName ? 1 : 0,
            contact.relationConfidence,
            contact.inferredGroup ?? null,
            contact.lastModifiedAt ?? null,
            contact.createdAt,
            contact.updatedAt,
          ],
        );

        for (const phoneNumber of contact.phoneNumbers) {
          await tx.executeAsync(
            'INSERT INTO contact_methods (id, contact_id, method_type, value) VALUES (?, ?, ?, ?)',
            [
              `${contact.id}-phone-${phoneNumber}`,
              contact.id,
              'phone',
              phoneNumber,
            ],
          );
        }

        for (const emailAddress of contact.emailAddresses) {
          await tx.executeAsync(
            'INSERT INTO contact_methods (id, contact_id, method_type, value) VALUES (?, ?, ?, ?)',
            [
              `${contact.id}-email-${emailAddress}`,
              contact.id,
              'email',
              emailAddress,
            ],
          );
        }
      }
    });
  }

  public async listContacts(): Promise<NormalizedContact[]> {
    const db = await this.connect();
    const contactsResult = await db.executeAsync<{
      id: string;
      external_id: string;
      source: string;
      given_name: string;
      family_name: string;
      display_name: string;
      sort_name: string;
      company: string | null;
      job_title: string | null;
      avatar_uri: string | null;
      avatar_seed: string;
      initials: string;
      notes: string | null;
      has_name: number;
      relation_confidence: number;
      inferred_group: string | null;
      last_modified_at: string | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM contacts ORDER BY sort_name ASC');
    const methodsResult = await db.executeAsync<{
      contact_id: string;
      method_type: string;
      value: string;
    }>('SELECT contact_id, method_type, value FROM contact_methods');

    const methodsMap = new Map<
      string,
      { phoneNumbers: string[]; emailAddresses: string[] }
    >();

    for (const row of methodsResult.rows._array) {
      const entry = methodsMap.get(row.contact_id) ?? {
        phoneNumbers: [],
        emailAddresses: [],
      };

      if (row.method_type === 'phone') {
        entry.phoneNumbers.push(row.value);
      } else {
        entry.emailAddresses.push(row.value);
      }

      methodsMap.set(row.contact_id, entry);
    }

    return contactsResult.rows._array.map(row => {
      const methods = methodsMap.get(row.id) ?? {
        phoneNumbers: [],
        emailAddresses: [],
      };

      return {
        id: row.id,
        externalId: row.external_id,
        source: row.source as NormalizedContact['source'],
        givenName: row.given_name,
        familyName: row.family_name,
        displayName: row.display_name,
        sortName: row.sort_name,
        company: row.company ?? undefined,
        jobTitle: row.job_title ?? undefined,
        avatarUri: row.avatar_uri ?? undefined,
        avatarSeed: row.avatar_seed,
        initials: row.initials,
        phoneNumbers: methods.phoneNumbers,
        emailAddresses: methods.emailAddresses,
        notes: row.notes ?? undefined,
        hasName: Boolean(row.has_name),
        relationConfidence: row.relation_confidence,
        inferredGroup: row.inferred_group as NormalizedContact['inferredGroup'],
        lastModifiedAt: row.last_modified_at ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  public async saveSession(session: EvaluationSession): Promise<void> {
    const db = await this.connect();
    await db.executeAsync(
      `INSERT OR REPLACE INTO sessions (
        id, mode, status, started_at, updated_at, completed_at, imported_count,
        deduplicated_count, hidden_count, ready_count, processed_count,
        skipped_count, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.mode,
        session.status,
        session.startedAt,
        session.updatedAt,
        session.completedAt ?? null,
        session.importedCount,
        session.deduplicatedCount,
        session.hiddenCount,
        session.readyCount,
        session.processedCount,
        session.skippedCount,
        session.source,
      ],
    );
  }

  public async listSessions(): Promise<EvaluationSession[]> {
    const db = await this.connect();
    const result = await db.executeAsync<{
      id: string;
      mode: string;
      status: string;
      started_at: string;
      updated_at: string;
      completed_at: string | null;
      imported_count: number;
      deduplicated_count: number;
      hidden_count: number;
      ready_count: number;
      processed_count: number;
      skipped_count: number;
      source: string;
    }>('SELECT * FROM sessions ORDER BY updated_at DESC');

    return result.rows._array.map(row => ({
      id: row.id,
      mode: row.mode as EvaluationSession['mode'],
      status: row.status as EvaluationSession['status'],
      startedAt: row.started_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at ?? undefined,
      importedCount: row.imported_count,
      deduplicatedCount: row.deduplicated_count,
      hiddenCount: row.hidden_count,
      readyCount: row.ready_count,
      processedCount: row.processed_count,
      skippedCount: row.skipped_count,
      source: row.source as EvaluationSession['source'],
    }));
  }

  public async getSession(
    sessionId: string,
  ): Promise<EvaluationSession | undefined> {
    const sessions = await this.listSessions();
    return sessions.find(session => session.id === sessionId);
  }

  public async saveEvaluation(evaluation: ContactEvaluation): Promise<void> {
    const db = await this.connect();
    await db.transaction(async tx => {
      await tx.executeAsync(
        `INSERT OR REPLACE INTO evaluations (
          id, session_id, contact_id, importance, comfort, activity,
          future_attention, stability, complexity, supportiveness,
          professional_value, emotional_weight, confidence, cluster_id, skipped,
          review_bin, revisit, pinned_to_core, marked_dormant, tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          evaluation.id,
          evaluation.sessionId,
          evaluation.contactId,
          evaluation.scores.importance,
          evaluation.scores.comfort,
          evaluation.scores.activity,
          evaluation.scores.futureAttention,
          evaluation.scores.stability,
          evaluation.scores.complexity,
          evaluation.scores.supportiveness,
          evaluation.scores.professionalValue,
          evaluation.scores.emotionalWeight,
          evaluation.confidence,
          evaluation.clusterId ?? null,
          evaluation.skipped ? 1 : 0,
          evaluation.reviewBin ?? null,
          evaluation.revisit ? 1 : 0,
          evaluation.pinnedToCore ? 1 : 0,
          evaluation.markedDormant ? 1 : 0,
          JSON.stringify(evaluation.tags),
          evaluation.createdAt,
          evaluation.updatedAt,
        ],
      );

      await tx.executeAsync(
        `INSERT OR REPLACE INTO session_contact_state (
          id, session_id, contact_id, evaluation_id, confidence, skipped, review_bin, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `${evaluation.sessionId}-${evaluation.contactId}`,
          evaluation.sessionId,
          evaluation.contactId,
          evaluation.id,
          evaluation.confidence,
          evaluation.skipped ? 1 : 0,
          evaluation.reviewBin ?? null,
          evaluation.updatedAt,
        ],
      );

      if (evaluation.note) {
        await tx.executeAsync(
          'INSERT OR REPLACE INTO notes (contact_id, content, updated_at) VALUES (?, ?, ?)',
          [evaluation.contactId, evaluation.note, evaluation.updatedAt],
        );
      }
    });
  }

  public async listEvaluations(
    sessionId?: string,
  ): Promise<ContactEvaluation[]> {
    const db = await this.connect();
    const result = await db.executeAsync<{
      id: string;
      session_id: string;
      contact_id: string;
      importance: number;
      comfort: number;
      activity: number;
      future_attention: number;
      stability: number;
      complexity: number;
      supportiveness: number;
      professional_value: number;
      emotional_weight: number;
      confidence: number;
      cluster_id: string | null;
      skipped: number;
      review_bin: string | null;
      revisit: number;
      pinned_to_core: number;
      marked_dormant: number;
      tags: string;
      created_at: string;
      updated_at: string;
    }>(
      sessionId
        ? 'SELECT * FROM evaluations WHERE session_id = ? ORDER BY updated_at DESC'
        : 'SELECT * FROM evaluations ORDER BY updated_at DESC',
      sessionId ? [sessionId] : [],
    );
    const notesResult = await db.executeAsync<{
      contact_id: string;
      content: string;
    }>('SELECT contact_id, content FROM notes');
    const notesMap = new Map(
      notesResult.rows._array.map(row => [row.contact_id, row.content]),
    );

    return result.rows._array.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      contactId: row.contact_id,
      scores: {
        importance: row.importance,
        comfort: row.comfort,
        activity: row.activity,
        futureAttention: row.future_attention,
        stability: row.stability,
        complexity: row.complexity,
        supportiveness: row.supportiveness,
        professionalValue: row.professional_value,
        emotionalWeight: row.emotional_weight,
      },
      tags: JSON.parse(row.tags) as ContactEvaluation['tags'],
      clusterId: row.cluster_id ?? undefined,
      confidence: row.confidence,
      skipped: Boolean(row.skipped),
      reviewBin: row.review_bin as ContactEvaluation['reviewBin'],
      note: notesMap.get(row.contact_id),
      revisit: Boolean(row.revisit),
      pinnedToCore: Boolean(row.pinned_to_core),
      markedDormant: Boolean(row.marked_dormant),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  public async deleteEvaluation(evaluationId: string): Promise<void> {
    const db = await this.connect();
    await db.executeAsync('DELETE FROM evaluations WHERE id = ?', [
      evaluationId,
    ]);
  }

  public async replaceClusters(clusters: Cluster[]): Promise<void> {
    const db = await this.connect();
    await db.transaction(async tx => {
      await tx.executeAsync('DELETE FROM cluster_members');
      await tx.executeAsync('DELETE FROM clusters');

      for (const cluster of clusters) {
        await tx.executeAsync(
          `INSERT INTO clusters (id, name, color, kind, locked, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            cluster.id,
            cluster.name,
            cluster.color,
            cluster.kind,
            cluster.locked ? 1 : 0,
            cluster.createdAt,
            cluster.updatedAt,
          ],
        );

        for (const contactId of cluster.contactIds) {
          await tx.executeAsync(
            'INSERT INTO cluster_members (id, cluster_id, contact_id) VALUES (?, ?, ?)',
            [`${cluster.id}-${contactId}`, cluster.id, contactId],
          );
        }
      }
    });
  }

  public async listClusters(): Promise<Cluster[]> {
    const db = await this.connect();
    const clustersResult = await db.executeAsync<{
      id: string;
      name: string;
      color: string;
      kind: string;
      locked: number;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM clusters ORDER BY name ASC');
    const membersResult = await db.executeAsync<{
      cluster_id: string;
      contact_id: string;
    }>('SELECT cluster_id, contact_id FROM cluster_members');
    const membersMap = new Map<string, string[]>();

    for (const row of membersResult.rows._array) {
      const values = membersMap.get(row.cluster_id) ?? [];
      values.push(row.contact_id);
      membersMap.set(row.cluster_id, values);
    }

    return clustersResult.rows._array.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      kind: row.kind as Cluster['kind'],
      contactIds: membersMap.get(row.id) ?? [],
      locked: Boolean(row.locked),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  public async saveExport(preset: ExportPreset): Promise<void> {
    const db = await this.connect();
    await db.executeAsync(
      `INSERT OR REPLACE INTO exports (id, type, title, hide_names, created_at, file_path)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        preset.id,
        preset.type,
        preset.title,
        preset.hideNames ? 1 : 0,
        preset.createdAt,
        preset.filePath ?? null,
      ],
    );
  }

  public async listExports(): Promise<ExportPreset[]> {
    const db = await this.connect();
    const result = await db.executeAsync<{
      id: string;
      type: string;
      title: string;
      hide_names: number;
      created_at: string;
      file_path: string | null;
    }>('SELECT * FROM exports ORDER BY created_at DESC');

    return result.rows._array.map(row => ({
      id: row.id,
      type: row.type as ExportPreset['type'],
      title: row.title,
      hideNames: Boolean(row.hide_names),
      createdAt: row.created_at,
      filePath: row.file_path ?? undefined,
    }));
  }

  public async saveDiagnostic(event: DiagnosticEvent): Promise<void> {
    const db = await this.connect();
    await db.executeAsync(
      `INSERT OR REPLACE INTO diagnostic_events (id, level, message, context, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        event.id,
        event.level,
        event.message,
        event.context ? JSON.stringify(event.context) : null,
        event.createdAt,
      ],
    );
  }

  public async listDiagnostics(limit: number): Promise<DiagnosticEvent[]> {
    const db = await this.connect();
    const result = await db.executeAsync<{
      id: string;
      level: string;
      message: string;
      context: string | null;
      created_at: string;
    }>('SELECT * FROM diagnostic_events ORDER BY created_at DESC LIMIT ?', [
      limit,
    ]);

    return result.rows._array.map(row => ({
      id: row.id,
      level: row.level as DiagnosticEvent['level'],
      message: row.message,
      context: row.context ? JSON.parse(row.context) : undefined,
      createdAt: row.created_at,
    }));
  }

  public async clearAll(): Promise<void> {
    const db = await this.connect();
    await db.executeBatchAsync([
      { query: 'DELETE FROM contact_methods' },
      { query: 'DELETE FROM contacts' },
      { query: 'DELETE FROM session_contact_state' },
      { query: 'DELETE FROM evaluations' },
      { query: 'DELETE FROM sessions' },
      { query: 'DELETE FROM cluster_members' },
      { query: 'DELETE FROM clusters' },
      { query: 'DELETE FROM notes' },
      { query: 'DELETE FROM exports' },
      { query: 'DELETE FROM diagnostic_events' },
    ]);
  }
}

let adapterInstance: PersistenceAdapter | undefined;

export async function getPersistenceAdapter(): Promise<PersistenceAdapter> {
  if (adapterInstance) {
    return adapterInstance;
  }

  if (isTestEnvironment()) {
    adapterInstance = new MemoryPersistenceAdapter();
    return adapterInstance;
  }

  const sqliteAdapter = new SQLitePersistenceAdapter();

  try {
    await sqliteAdapter.initialize();
    adapterInstance = sqliteAdapter;
  } catch (error) {
    console.warn('Falling back to memory persistence', error);
    adapterInstance = new MemoryPersistenceAdapter();
  }

  return adapterInstance;
}
