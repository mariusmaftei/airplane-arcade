import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import SoundPressable from "./SoundPressable";
import {
  UI_PRIMARY,
  UI_WHITE,
  UI_BODY_MUTED,
  UI_INPUT_BG,
  UI_INPUT_BORDER,
} from "../constants/constants";

const PLAYER_OPTIONS = [
  { min: 2, max: 2, label: "2" },
  { min: 2, max: 3, label: "3" },
  { min: 2, max: 4, label: "4" },
  { min: 2, max: 5, label: "5" },
  { min: 2, max: 6, label: "6" },
  { min: 2, max: 7, label: "7" },
  { min: 2, max: 8, label: "8" },
  { min: 2, max: 9, label: "9" },
  { min: 2, max: 10, label: "10" },
];

export default function LanHostSetup({
  onContinue,
  onBack,
  password: initialPassword = "",
  minPlayers: initialMin = 2,
  maxPlayers: initialMax = 2,
  onConfigChange,
}) {
  const [password, setPassword] = useState(initialPassword);
  const [playerOption, setPlayerOption] = useState(
    PLAYER_OPTIONS.find(
      (o) => o.min === initialMin && o.max === initialMax,
    ) ?? PLAYER_OPTIONS[0],
  );

  const handleContinue = () => {
    const config = {
      password: password.trim() || null,
      minPlayers: playerOption.min,
      maxPlayers: playerOption.max,
    };
    onConfigChange?.(config);
    onContinue(config);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.title}>Host LAN game</Text>
        <Text style={styles.subtitle}>Create a game others can join</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Password (optional)</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Leave empty for no password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            maxLength={20}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Max players (2–10 total)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {PLAYER_OPTIONS.map((opt) => {
              const isActive =
                playerOption.min === opt.min && playerOption.max === opt.max;
              return (
                <SoundPressable
                  key={opt.label}
                  style={({ pressed }) => [
                    styles.chip,
                    isActive ? styles.chipSelected : styles.chipUnselected,
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => setPlayerOption(opt)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isActive ? styles.chipTextSelected : styles.chipTextUnselected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </SoundPressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.actions}>
          <SoundPressable
            style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.8 }]}
            onPress={onBack}
          >
            <Text style={styles.btnSecondaryText}>Back</Text>
          </SoundPressable>
          <SoundPressable
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.9 }]}
            onPress={handleContinue}
          >
            <Text style={styles.btnPrimaryText}>Create game</Text>
          </SoundPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", alignItems: "center" },
  card: {
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: UI_WHITE,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 24,
  },
  section: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: UI_WHITE,
    marginBottom: 8,
  },
  input: {
    backgroundColor: UI_INPUT_BG,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 2,
    borderColor: UI_INPUT_BORDER,
    color: UI_WHITE,
  },
  chipRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  chipSelected: {
    backgroundColor: UI_PRIMARY,
  },
  chipUnselected: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  chipPressed: { opacity: 0.8 },
  chipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: UI_WHITE,
  },
  chipTextUnselected: {
    color: "rgba(255,255,255,0.8)",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: UI_WHITE,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: UI_PRIMARY,
    alignItems: "center",
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: UI_WHITE,
  },
});
