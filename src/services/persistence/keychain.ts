import * as Keychain from 'react-native-keychain';

import { MMKV_SERVICE } from '@/constants/app';
import { createId } from '@/utils/ids';

export async function getOrCreateEncryptionKey(): Promise<string> {
  const credentials = await Keychain.getGenericPassword({
    service: MMKV_SERVICE,
  });

  if (credentials) {
    return credentials.password;
  }

  const encryptionKey = createId().replace(/-/g, '').slice(0, 32);

  await Keychain.setGenericPassword('bonda', encryptionKey, {
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    service: MMKV_SERVICE,
  });

  return encryptionKey;
}
