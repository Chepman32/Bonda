import { DataRepository } from '@/services/repositories/dataRepository';

import { makeContact, makeEvaluation } from '../factories/entities';

describe('DataRepository', () => {
  it('persists contacts, sessions, evaluations, clusters, exports, and diagnostics in memory tests', async () => {
    const repository = new DataRepository();
    const contact = makeContact();

    await repository.replaceContacts([contact]);
    const session = await repository.createSession({
      mode: 'quick',
      source: 'device',
      progress: {
        imported: 1,
        deduplicated: 0,
        hidden: 0,
        ready: 1,
        total: 1,
        stage: 'complete',
      },
    });
    const evaluation = makeEvaluation({
      sessionId: session.id,
      contactId: contact.id,
    });

    await repository.saveEvaluation(evaluation);
    const clusters = await repository.syncClusters([contact], [evaluation]);
    await repository.saveExport({
      id: 'export-1',
      type: 'poster',
      title: 'Snapshot',
      hideNames: true,
      createdAt: '2026-03-20T00:00:00.000Z',
      filePath: '/tmp/snapshot.png',
    });
    await repository.saveDiagnostic({
      id: 'diagnostic-1',
      level: 'info',
      message: 'ready',
      createdAt: '2026-03-20T00:00:00.000Z',
    });

    await expect(repository.listContacts()).resolves.toHaveLength(1);
    await expect(repository.listSessions()).resolves.toHaveLength(1);
    await expect(repository.listEvaluations(session.id)).resolves.toHaveLength(
      1,
    );
    await expect(repository.listClusters()).resolves.toEqual(clusters);
    await expect(repository.listExports()).resolves.toHaveLength(1);
    await expect(repository.listDiagnostics(10)).resolves.toHaveLength(1);
  });
});
