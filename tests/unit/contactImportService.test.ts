import Contacts from 'react-native-contacts';

import {
  importAndNormalizeContacts,
  refreshContactAvatarUris,
} from '@/services/contactImportService';

const mockedContacts = Contacts as unknown as {
  getAll: jest.Mock;
};

describe('contactImportService', () => {
  beforeEach(() => {
    mockedContacts.getAll.mockReset();
  });

  it('returns preview contacts when demo mode is requested', async () => {
    const result = await importAndNormalizeContacts({ usePreview: true });

    expect(result.contacts).toHaveLength(8);
    expect(result.contacts.every(contact => contact.source === 'demo')).toBe(
      true,
    );
    expect(result.progress.stage).toBe('complete');
  });

  it('deduplicates only when normalized name and phone or email overlap', async () => {
    mockedContacts.getAll.mockResolvedValue([
      {
        recordID: '1',
        givenName: 'Mila',
        familyName: 'Stone',
        displayName: 'Mila Stone',
        phoneNumbers: [{ number: '+1 (555) 111-1111' }],
        emailAddresses: [],
        company: '',
        jobTitle: '',
        note: '',
        thumbnailPath: '',
      },
      {
        recordID: '2',
        givenName: 'Mila',
        familyName: 'Stone',
        displayName: 'Mila Stone',
        phoneNumbers: [{ number: '+1 555 111 1111' }],
        emailAddresses: [],
        company: '',
        jobTitle: '',
        note: '',
        thumbnailPath: '',
      },
      {
        recordID: '3',
        givenName: '',
        familyName: '',
        displayName: '',
        phoneNumbers: [],
        emailAddresses: [],
        company: '',
        jobTitle: '',
        note: '',
        thumbnailPath: '',
      },
    ]);

    const result = await importAndNormalizeContacts({});

    expect(result.progress.imported).toBe(3);
    expect(result.progress.deduplicated).toBe(1);
    expect(result.progress.hidden).toBe(1);
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].phoneNumbers).toEqual(['+15551111111']);
  });

  it('refreshes avatar paths for existing device contacts without changing ids', async () => {
    mockedContacts.getAll.mockResolvedValue([
      {
        recordID: 'external-1',
        thumbnailPath: '/var/mobile/new-avatar.jpg',
      },
    ]);

    const nextContacts = await refreshContactAvatarUris([
      {
        id: 'contact-1',
        externalId: 'external-1',
        source: 'device',
        givenName: 'Mila',
        familyName: 'Stone',
        displayName: 'Mila Stone',
        sortName: 'mila stone',
        company: undefined,
        jobTitle: undefined,
        avatarUri: undefined,
        avatarSeed: 'seed-1',
        initials: 'MS',
        phoneNumbers: [],
        emailAddresses: [],
        notes: undefined,
        hasName: true,
        relationConfidence: 0.8,
        inferredGroup: undefined,
        lastModifiedAt: undefined,
        createdAt: '2026-03-20T00:00:00.000Z',
        updatedAt: '2026-03-20T00:00:00.000Z',
      },
    ]);

    expect(nextContacts[0].id).toBe('contact-1');
    expect(nextContacts[0].avatarUri).toBe('/var/mobile/new-avatar.jpg');
  });
});
