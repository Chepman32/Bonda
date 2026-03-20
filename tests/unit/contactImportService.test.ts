import Contacts from 'react-native-contacts';

import { importAndNormalizeContacts } from '@/services/contactImportService';

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
});
