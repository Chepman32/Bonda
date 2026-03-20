import { DEFAULT_SETTINGS } from '@/constants/app';
import { initializeKeyValueStorage } from '@/services/persistence/mmkv';
import { SettingsRepository } from '@/services/repositories/settingsRepository';

describe('SettingsRepository', () => {
  it('falls back to defaults when storage is empty or invalid', async () => {
    const repository = new SettingsRepository();
    const storage = await initializeKeyValueStorage('test-key');
    storage.set('app.settings', '{invalid-json');

    await expect(repository.getSettings()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it('merges settings patches and persists them', async () => {
    const repository = new SettingsRepository();

    const merged = await repository.mergeSettings({
      reducedMotion: true,
      diagnosticsEnabled: false,
    });

    expect(merged.reducedMotion).toBe(true);
    expect(merged.diagnosticsEnabled).toBe(false);
    await expect(repository.getSettings()).resolves.toMatchObject({
      reducedMotion: true,
      diagnosticsEnabled: false,
    });
  });
});
