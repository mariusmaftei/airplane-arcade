import { createContext, useContext, useEffect } from "react";
import { useAudioPlayer } from "expo-audio";
import { TAP_SOUND } from "../constants/constants";
import { useSoundSettings } from "./SoundSettingsContext";

const TapSoundContext = createContext(null);

export function TapSoundProvider({ children }) {
  const player = useAudioPlayer(TAP_SOUND, { shouldPlay: false });
  const { soundEffectsVolumeEffective } = useSoundSettings();

  useEffect(() => {
    player.volume = soundEffectsVolumeEffective;
  }, [player, soundEffectsVolumeEffective]);

  const playTapSound = () => {
    try {
      if (soundEffectsVolumeEffective <= 0) return;
      player.seekTo(0);
      player.play();
    } catch {}
  };

  return (
    <TapSoundContext.Provider value={{ playTapSound }}>
      {children}
    </TapSoundContext.Provider>
  );
}

export function useTapSound() {
  const ctx = useContext(TapSoundContext);
  return ctx?.playTapSound ?? (() => {});
}
