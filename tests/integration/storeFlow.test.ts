import Contacts from 'react-native-contacts';
import { check, RESULTS } from 'react-native-permissions';

import { getDataRepository } from '@/services/repositories/dataRepository';
import { getSettingsRepository } from '@/services/repositories/settingsRepository';
import { useAppStore } from '@/store/useAppStore';

import {
  makeContact,
  makeEvaluation,
  makeSession,
} from '../factories/entities';
import { resetAppTestState } from '../helpers/resetStore';

const mockedContacts = Contacts as unknown as {
  getAll: jest.Mock;
};
const mockedCheck = check as jest.Mock;

describe('store flow', () => {
  beforeEach(async () => {
    await resetAppTestState();
    mockedCheck.mockResolvedValue(RESULTS.GRANTED);
    mockedContacts.getAll.mockResolvedValue([
      {
        recordID: '1',
        givenName: 'Mila',
        familyName: 'Stone',
        displayName: 'Mila Stone',
        phoneNumbers: [{ number: '+1 555 111 1111' }],
        emailAddresses: [{ email: 'mila@example.com' }],
        company: '',
        jobTitle: '',
        note: '',
        thumbnailPath: '',
      },
    ]);
  });

  it('bootstraps, imports contacts, starts a session, and commits an evaluation', async () => {
    await useAppStore.getState().bootstrapApp();
    expect(useAppStore.getState().bootState).toBe('ready');
    expect(useAppStore.getState().permissionState).toBe('granted');

    await useAppStore.getState().importContactsIntoState(false);
    expect(useAppStore.getState().contacts).toHaveLength(1);
    expect(useAppStore.getState().settings.hasCompletedOnboarding).toBe(true);

    await useAppStore.getState().startSession();
    expect(useAppStore.getState().session?.status).toBe('active');

    await useAppStore.getState().commitGestureEvaluation({
      translationX: 180,
      translationY: -120,
      velocityX: 900,
      velocityY: 400,
    });

    expect(Object.values(useAppStore.getState().evaluations)).toHaveLength(1);
    expect(useAppStore.getState().session?.processedCount).toBe(1);
    expect(useAppStore.getState().clusters.length).toBeGreaterThan(0);
    expect(useAppStore.getState().insights.length).toBe(10);
  });

  it('resets in-memory evaluations when a new session starts', async () => {
    await resetAppTestState();

    useAppStore.setState({
      contacts: [
        makeContact({ id: 'contact-1', externalId: 'external-1' }),
        makeContact({
          id: 'contact-2',
          externalId: 'external-2',
          givenName: 'Ira',
          familyName: 'West',
          displayName: 'Ira West',
          sortName: 'ira west',
          avatarSeed: 'seed-2',
          initials: 'IW',
          phoneNumbers: ['+15550000002'],
          emailAddresses: ['ira@example.com'],
        }),
      ],
      importProgress: {
        imported: 2,
        deduplicated: 0,
        hidden: 0,
        ready: 2,
        total: 2,
        stage: 'complete',
      },
    });

    await useAppStore.getState().startSession();
    const firstSessionId = useAppStore.getState().session?.id;

    await useAppStore.getState().commitGestureEvaluation({
      translationX: 160,
      translationY: -40,
      velocityX: 800,
      velocityY: 120,
    });
    await useAppStore.getState().completeSession();
    await useAppStore.getState().startSession();

    const state = useAppStore.getState();

    expect(firstSessionId).toBeDefined();
    expect(state.session?.processedCount).toBe(0);
    expect(state.session?.status).toBe('active');
    expect(state.evaluations).toEqual({});
    expect(state.selectedContactId).toBe('contact-1');
    await expect(getDataRepository().listEvaluations()).resolves.toHaveLength(
      1,
    );
  });

  it('advances using only active-session evaluations when older sessions exist', async () => {
    await resetAppTestState();

    useAppStore.setState({
      contacts: [
        makeContact({ id: 'contact-1', externalId: 'external-1' }),
        makeContact({
          id: 'contact-2',
          externalId: 'external-2',
          givenName: 'Ira',
          familyName: 'West',
          displayName: 'Ira West',
          sortName: 'ira west',
          avatarSeed: 'seed-2',
          initials: 'IW',
          phoneNumbers: ['+15550000002'],
          emailAddresses: ['ira@example.com'],
        }),
        makeContact({
          id: 'contact-3',
          externalId: 'external-3',
          givenName: 'Noa',
          familyName: 'Lane',
          displayName: 'Noa Lane',
          sortName: 'noa lane',
          avatarSeed: 'seed-3',
          initials: 'NL',
          phoneNumbers: ['+15550000003'],
          emailAddresses: ['noa@example.com'],
        }),
      ],
      importProgress: {
        imported: 3,
        deduplicated: 0,
        hidden: 0,
        ready: 3,
        total: 3,
        stage: 'complete',
      },
      session: makeSession({
        id: 'session-2',
        importedCount: 3,
        readyCount: 3,
      }),
      selectedContactId: 'contact-1',
      evaluations: {
        oldContactTwo: makeEvaluation({
          id: 'old-contact-2',
          sessionId: 'session-1',
          contactId: 'contact-2',
        }),
        oldContactThree: makeEvaluation({
          id: 'old-contact-3',
          sessionId: 'session-1',
          contactId: 'contact-3',
        }),
      },
    });

    await useAppStore.getState().commitGestureEvaluation({
      translationX: 200,
      translationY: -50,
      velocityX: 1000,
      velocityY: 0,
    });

    const state = useAppStore.getState();

    expect(state.selectedContactId).toBe('contact-2');
    expect(state.session?.processedCount).toBe(1);
    expect(
      Object.values(state.evaluations).filter(
        evaluation => evaluation.sessionId === 'session-2',
      ),
    ).toHaveLength(1);
  });

  it('retires old unfinished sessions when starting a fresh deck', async () => {
    await resetAppTestState();

    useAppStore.setState({
      contacts: [
        makeContact({ id: 'contact-1', externalId: 'external-1' }),
        makeContact({
          id: 'contact-2',
          externalId: 'external-2',
          givenName: 'Ira',
          familyName: 'West',
          displayName: 'Ira West',
          sortName: 'ira west',
          avatarSeed: 'seed-2',
          initials: 'IW',
          phoneNumbers: ['+15550000002'],
          emailAddresses: ['ira@example.com'],
        }),
      ],
      importProgress: {
        imported: 2,
        deduplicated: 0,
        hidden: 0,
        ready: 2,
        total: 2,
        stage: 'complete',
      },
    });

    await getDataRepository().saveSession(
      makeSession({
        id: 'old-active',
        status: 'active',
      }),
    );
    await getDataRepository().saveSession(
      makeSession({
        id: 'old-paused',
        status: 'paused',
      }),
    );

    await useAppStore.getState().startSession();

    const sessions = await getDataRepository().listSessions();
    const lastSessionId = (await getSettingsRepository().getSettings())
      .lastSessionId;

    expect(
      sessions.filter(
        session => session.status === 'active' || session.status === 'paused',
      ),
    ).toHaveLength(1);
    expect(sessions.find(session => session.id === 'old-active')?.status).toBe(
      'completed',
    );
    expect(sessions.find(session => session.id === 'old-paused')?.status).toBe(
      'completed',
    );
    expect(lastSessionId).toBe(useAppStore.getState().session?.id);
  });

  it('bootstraps the last-started unfinished session instead of a stale older one', async () => {
    await resetAppTestState();

    await getDataRepository().replaceContacts([
      makeContact({ id: 'contact-1', externalId: 'external-1' }),
      makeContact({
        id: 'contact-2',
        externalId: 'external-2',
        givenName: 'Ira',
        familyName: 'West',
        displayName: 'Ira West',
        sortName: 'ira west',
        avatarSeed: 'seed-2',
        initials: 'IW',
        phoneNumbers: ['+15550000002'],
        emailAddresses: ['ira@example.com'],
      }),
      makeContact({
        id: 'contact-3',
        externalId: 'external-3',
        givenName: 'Noa',
        familyName: 'Lane',
        displayName: 'Noa Lane',
        sortName: 'noa lane',
        avatarSeed: 'seed-3',
        initials: 'NL',
        phoneNumbers: ['+15550000003'],
        emailAddresses: ['noa@example.com'],
      }),
    ]);

    await getDataRepository().saveSession(
      makeSession({
        id: 'stale-session',
        status: 'active',
        updatedAt: '2026-03-24T12:00:00.000Z',
        readyCount: 3,
      }),
    );
    await getDataRepository().saveSession(
      makeSession({
        id: 'fresh-session',
        status: 'active',
        updatedAt: '2026-03-24T10:00:00.000Z',
        readyCount: 3,
      }),
    );
    await getDataRepository().saveEvaluation(
      makeEvaluation({
        id: 'stale-evaluation-1',
        sessionId: 'stale-session',
        contactId: 'contact-1',
      }),
    );
    await getDataRepository().saveEvaluation(
      makeEvaluation({
        id: 'stale-evaluation-2',
        sessionId: 'stale-session',
        contactId: 'contact-2',
      }),
    );
    await getSettingsRepository().mergeSettings({
      lastSessionId: 'fresh-session',
    });

    await useAppStore.getState().bootstrapApp();
    const state = useAppStore.getState();

    expect(state.session?.id).toBe('fresh-session');
    expect(state.selectedContactId).toBe('contact-1');
    expect(Object.values(state.evaluations)).toHaveLength(0);
  });
});
