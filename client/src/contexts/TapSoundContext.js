import { createContext, useContext } from "react";
import { useAudioPlayer } from "expo-audio";
import { TAP_SOUND } from "../constants/constants";

const TapSoundContext = createContext(null);

export function TapSoundProvider({ children }) {
  const player = useAudioPlayer(TAP_SOUND, { shouldPlay: false });

  const playTapSound = () => {
    try {
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
