import Contacts, { type Contact } from 'react-native-contacts';

import type {
  ContactSource,
  ImportProgress,
  NormalizedContact,
} from '@/models/entities';
import { createId } from '@/utils/ids';
import {
  createInitials,
  hashString,
  normalizeWhitespace,
  safeLowercase,
} from '@/utils/strings';

function fingerprintPhone(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

function fingerprintEmail(value: string): string {
  return safeLowercase(value);
}

function toNormalizedContact(
  contact: Contact,
  source: ContactSource,
): NormalizedContact {
  const givenName = normalizeWhitespace(contact.givenName ?? '');
  const familyName = normalizeWhitespace(contact.familyName ?? '');
  const displayName = normalizeWhitespace(
    contact.displayName ?? `${givenName} ${familyName}`,
  );
  const sortName = safeLowercase(displayName || `${givenName} ${familyName}`);
  const phoneNumbers = contact.phoneNumbers
    .map(item => fingerprintPhone(item.number))
    .filter(Boolean);
  const emailAddresses = contact.emailAddresses
    .map(item => fingerprintEmail(item.email))
    .filter(Boolean);
  const now = new Date().toISOString();

  return {
    id: createId(),
    externalId: contact.recordID,
    source,
    givenName,
    familyName,
    displayName: displayName || 'Unknown contact',
    sortName,
    company: contact.company ?? undefined,
    jobTitle: contact.jobTitle ?? undefined,
    avatarUri: contact.thumbnailPath || undefined,
    avatarSeed: hashString(displayName || contact.recordID),
    initials: createInitials(displayName || `${givenName} ${familyName}`),
    phoneNumbers,
    emailAddresses,
    notes: contact.note ?? undefined,
    hasName: Boolean(displayName || givenName || familyName),
    relationConfidence:
      phoneNumbers.length + emailAddresses.length > 0 ? 0.7 : 0.35,
    inferredGroup: inferGroup(contact),
    lastModifiedAt: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

function inferGroup(contact: Contact): NormalizedContact['inferredGroup'] {
  const jobTitle = safeLowercase(contact.jobTitle);
  const company = safeLowercase(contact.company);
  const note = safeLowercase(contact.note);
  const displayName = safeLowercase(contact.displayName);

  if (jobTitle || company) {
    return 'work';
  }

  if (note.includes('mentor')) {
    return 'mentor';
  }

  if (displayName.includes('mom') || displayName.includes('dad')) {
    return 'family';
  }

  return undefined;
}

function canMergeContact(
  left: NormalizedContact,
  right: NormalizedContact,
): boolean {
  if (left.sortName !== right.sortName) {
    return false;
  }

  const hasOverlappingPhone = left.phoneNumbers.some(phone =>
    right.phoneNumbers.includes(phone),
  );
  const hasOverlappingEmail = left.emailAddresses.some(email =>
    right.emailAddresses.includes(email),
  );

  return hasOverlappingPhone || hasOverlappingEmail;
}

function mergeContacts(
  left: NormalizedContact,
  right: NormalizedContact,
): NormalizedContact {
  return {
    ...left,
    company: left.company ?? right.company,
    jobTitle: left.jobTitle ?? right.jobTitle,
    avatarUri: left.avatarUri ?? right.avatarUri,
    phoneNumbers: [...new Set([...left.phoneNumbers, ...right.phoneNumbers])],
    emailAddresses: [
      ...new Set([...left.emailAddresses, ...right.emailAddresses]),
    ],
    notes: left.notes ?? right.notes,
    relationConfidence: Math.max(
      left.relationConfidence,
      right.relationConfidence,
    ),
    updatedAt: new Date().toISOString(),
  };
}

function buildPreviewContacts(): NormalizedContact[] {
  const preview: Array<
    Partial<NormalizedContact> & Pick<NormalizedContact, 'displayName'>
  > = [
    {
      displayName: 'Mila Voronina',
      phoneNumbers: ['+15550000001'],
      inferredGroup: 'family',
    },
    {
      displayName: 'Artem Lebedev',
      phoneNumbers: ['+15550000002'],
      inferredGroup: 'work',
    },
    {
      displayName: 'Sasha Molina',
      phoneNumbers: ['+15550000003'],
      inferredGroup: 'close_friend',
    },
    {
      displayName: 'Daria Chen',
      phoneNumbers: ['+15550000004'],
      inferredGroup: 'creative',
    },
    {
      displayName: 'Owen Hart',
      phoneNumbers: ['+15550000005'],
      inferredGroup: 'mentor',
    },
    {
      displayName: 'Nadia Brooks',
      phoneNumbers: ['+15550000006'],
      inferredGroup: 'supportive',
    },
    {
      displayName: 'Yana Price',
      phoneNumbers: ['+15550000007'],
      inferredGroup: 'friend',
    },
    {
      displayName: 'Theo Novak',
      phoneNumbers: ['+15550000008'],
      inferredGroup: 'complicated',
    },
  ];

  return preview.map(item => {
    const now = new Date().toISOString();
    return {
      id: createId(),
      externalId: createId(),
      source: 'demo',
      givenName: item.displayName.split(' ')[0] ?? item.displayName,
      familyName: item.displayName.split(' ').slice(1).join(' '),
      displayName: item.displayName,
      sortName: safeLowercase(item.displayName),
      company: undefined,
      jobTitle: undefined,
      avatarUri: undefined,
      avatarSeed: hashString(item.displayName),
      initials: createInitials(item.displayName),
      phoneNumbers: item.phoneNumbers ?? [],
      emailAddresses: [],
      notes: undefined,
      hasName: true,
      relationConfidence: 0.8,
      inferredGroup: item.inferredGroup,
      createdAt: now,
      updatedAt: now,
    };
  });
}

export async function importAndNormalizeContacts(options: {
  usePreview?: boolean;
  onProgress?: (progress: ImportProgress) => void;
}): Promise<{
  contacts: NormalizedContact[];
  progress: ImportProgress;
}> {
  const onProgress = options.onProgress;

  onProgress?.({
    imported: 0,
    deduplicated: 0,
    hidden: 0,
    ready: 0,
    total: 0,
    stage: 'readingContacts',
  });

  const normalizedContacts: NormalizedContact[] = options.usePreview
    ? buildPreviewContacts()
    : (await Contacts.getAll()).map((contact: Contact) =>
        toNormalizedContact(contact, 'device'),
      );

  onProgress?.({
    imported: normalizedContacts.length,
    deduplicated: 0,
    hidden: 0,
    ready: 0,
    total: normalizedContacts.length,
    stage: 'normalizing',
  });

  const mergedContacts: NormalizedContact[] = [];
  let deduplicated = 0;

  for (const contact of normalizedContacts) {
    const existingIndex = mergedContacts.findIndex(candidate =>
      canMergeContact(candidate, contact),
    );

    if (existingIndex >= 0) {
      mergedContacts[existingIndex] = mergeContacts(
        mergedContacts[existingIndex],
        contact,
      );
      deduplicated += 1;
    } else {
      mergedContacts.push(contact);
    }
  }

  const hiddenContacts = mergedContacts.filter(
    contact => !contact.hasName && contact.phoneNumbers.length === 0,
  ).length;
  const readyContacts = mergedContacts.filter(
    contact => contact.hasName || contact.phoneNumbers.length > 0,
  );

  const progress: ImportProgress = {
    imported: normalizedContacts.length,
    deduplicated,
    hidden: hiddenContacts,
    ready: readyContacts.length,
    total: normalizedContacts.length,
    stage: 'complete',
  };

  onProgress?.(progress);

  return {
    contacts: readyContacts,
    progress,
  };
}
