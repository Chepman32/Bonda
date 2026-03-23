import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAppStore } from '@/store/useAppStore';

export function useHotReloadContactAvatars(): void {
  const refreshContactAvatars = useAppStore(
    state => state.refreshContactAvatars,
  );

  const refresh = useCallback(() => {
    void refreshContactAvatars().catch(() => undefined);
  }, [refreshContactAvatars]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        refresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);
}
