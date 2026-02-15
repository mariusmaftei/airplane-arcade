import { Pressable } from "react-native";
import { useTapSound } from "../contexts/TapSoundContext";

export default function SoundPressable({
  onPressIn,
  onPress,
  sound = true,
  ...rest
}) {
  const playTapSound = useTapSound();

  const handlePressIn = (e) => {
    if (sound) playTapSound();
    onPressIn?.(e);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPress={onPress} {...rest} />
  );
}
