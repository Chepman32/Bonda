import Contacts from 'react-native-contacts';
import { check, RESULTS } from 'react-native-permissions';

import { useAppStore } from '@/store/useAppStore';

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
});
