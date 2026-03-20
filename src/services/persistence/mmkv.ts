import { createMMKV, type MMKV } from 'react-native-mmkv';

import { MMKV_ID } from '@/constants/app';

type StorageValue = boolean | number | string;

class MemoryKV {
  private readonly storage = new Map<string, StorageValue>();

  public getString(key: string): string | undefined {
    const value = this.storage.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  public getBoolean(key: string): boolean | undefined {
    const value = this.storage.get(key);
    return typeof value === 'boolean' ? value : undefined;
  }

  public getNumber(key: string): number | undefined {
    const value = this.storage.get(key);
    return typeof value === 'number' ? value : undefined;
  }

  public set(key: string, value: StorageValue): void {
    this.storage.set(key, value);
  }

  public delete(key: string): void {
    this.storage.delete(key);
  }
}

export interface KeyValueStorage {
  getString(key: string): string | undefined;
  getBoolean(key: string): boolean | undefined;
  getNumber(key: string): number | undefined;
  set(key: string, value: StorageValue): void;
  delete(key: string): void;
}

let storageInstance: KeyValueStorage | undefined;

function isJestEnvironment(): boolean {
  return (
    typeof jest !== 'undefined' ||
    global.process?.env?.JEST_WORKER_ID !== undefined
  );
}

export async function initializeKeyValueStorage(
  encryptionKey: string,
): Promise<KeyValueStorage> {
  if (storageInstance) {
    return storageInstance;
  }

  if (isJestEnvironment()) {
    storageInstance = new MemoryKV();
    return storageInstance;
  }

  const mmkv = createMMKV({
    id: MMKV_ID,
    encryptionKey,
    encryptionType: 'AES-256',
  }) as MMKV;

  storageInstance = {
    getString: key => mmkv.getString(key),
    getBoolean: key => mmkv.getBoolean(key),
    getNumber: key => mmkv.getNumber(key),
    set: (key, value) => {
      mmkv.set(key, value);
    },
    delete: key => {
      mmkv.remove(key);
    },
  };

  return storageInstance;
}
