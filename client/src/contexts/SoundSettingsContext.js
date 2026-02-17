import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@airplanes_sound_settings";

const DEFAULT = {
  soundEffectsVolume: 1,
  soundEffectsMuted: false,
  battleMusicVolume: 1,
  battleMusicMuted: false,
};

const SoundSettingsContext = createContext(null);

export function SoundSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setSettings((s) => ({ ...s, ...parsed }));
          } catch {}
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const save = useCallback((next) => {
    setSettings((s) => {
      const updated = { ...s, ...next };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const setSoundEffectsVolume = useCallback(
    (v) => save({ soundEffectsVolume: Math.max(0, Math.min(1, v)) }),
    [save],
  );
  const setSoundEffectsMuted = useCallback(
    (v) => save({ soundEffectsMuted: !!v }),
    [save],
  );
  const setBattleMusicVolume = useCallback(
    (v) => save({ battleMusicVolume: Math.max(0, Math.min(1, v)) }),
    [save],
  );
  const setBattleMusicMuted = useCallback(
    (v) => save({ battleMusicMuted: !!v }),
    [save],
  );

  const value = {
    ...settings,
    loaded,
    setSoundEffectsVolume,
    setSoundEffectsMuted,
    setBattleMusicVolume,
    setBattleMusicMuted,
    soundEffectsVolumeEffective: settings.soundEffectsMuted
      ? 0
      : settings.soundEffectsVolume,
    battleMusicVolumeEffective: settings.battleMusicMuted
      ? 0
      : settings.battleMusicVolume,
  };

  return (
    <SoundSettingsContext.Provider value={value}>
      {children}
    </SoundSettingsContext.Provider>
  );
}

export function useSoundSettings() {
  const ctx = useContext(SoundSettingsContext);
  return ctx ?? { ...DEFAULT, loaded: false };
}
