import { DEFAULT_SETTINGS } from '@/constants/app';
import type { AppSettings } from '@/models/entities';
import { getOrCreateEncryptionKey } from '@/services/persistence/keychain';
import {
  initializeKeyValueStorage,
  type KeyValueStorage,
} from '@/services/persistence/mmkv';

const SETTINGS_KEY = 'app.settings';

export class SettingsRepository {
  private storage?: KeyValueStorage;

  private async ensureStorage(): Promise<KeyValueStorage> {
    if (this.storage) {
      return this.storage;
    }

    const encryptionKey = await getOrCreateEncryptionKey();
    this.storage = await initializeKeyValueStorage(encryptionKey);
    return this.storage;
  }

  public async getSettings(): Promise<AppSettings> {
    const storage = await this.ensureStorage();
    const rawValue = storage.getString(SETTINGS_KEY);

    if (!rawValue) {
      return DEFAULT_SETTINGS;
    }

    try {
      return {
        ...DEFAULT_SETTINGS,
        ...(JSON.parse(rawValue) as Partial<AppSettings>),
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public async saveSettings(nextSettings: AppSettings): Promise<AppSettings> {
    const storage = await this.ensureStorage();
    storage.set(SETTINGS_KEY, JSON.stringify(nextSettings));
    return nextSettings;
  }

  public async mergeSettings(
    patch: Partial<AppSettings>,
  ): Promise<AppSettings> {
    const currentSettings = await this.getSettings();
    return this.saveSettings({
      ...currentSettings,
      ...patch,
    });
  }

  public async clear(): Promise<void> {
    const storage = await this.ensureStorage();
    storage.delete(SETTINGS_KEY);
  }
}

let repositoryInstance: SettingsRepository | undefined;

export function getSettingsRepository(): SettingsRepository {
  repositoryInstance ??= new SettingsRepository();
  return repositoryInstance;
}
