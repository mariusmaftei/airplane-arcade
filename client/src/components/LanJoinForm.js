import { useState } from "react";
import {
  Platform,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import SoundPressable from "./SoundPressable";
import { UI_PRIMARY, UI_WHITE, UI_BODY_MUTED } from "../constants/constants";

const EMULATOR_HINT =
  Platform.OS === "android"
    ? "Joining from emulator? Use 10.0.2.2 to reach the host PC."
    : null;

export default function LanJoinForm({
  onFound,
  loading,
  onFind,
  baseUrl,
  onServerUrlChange,
  buttonLabel = "Find game",
}) {
  const [serverUrl, setServerUrl] = useState(baseUrl || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleFind = async () => {
    const url = (serverUrl || "").trim().replace(/\/+$/, "");
    if (!url) {
      setError("Enter server address (e.g. 192.168.1.5)");
      return;
    }
    if (/182\.168\./.test(url)) {
      setError('Typo: "182.168" should be "192.168" (e.g. 192.168.1.2)');
      return;
    }
    const base = url.startsWith("http") ? url : `http://${url}:8080`;
    if (!code || code.trim().length < 4) {
      setError("Enter the 6-character game code");
      return;
    }
    setError(null);
    onServerUrlChange?.(base);
    try {
      const info = await onFind(base, code.trim().toUpperCase());
      onFound({ ...info, joinPassword: password.trim() || null, joinBaseUrl: base });
    } catch (e) {
      setError(e.message || "Could not find game");
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Enter the host's IP and game code (both devices must be on the same LAN)
      </Text>
      {EMULATOR_HINT && (
        <Text style={styles.emulatorHint}>{EMULATOR_HINT}</Text>
      )}
      <View style={styles.inputWrap}>
        <Text style={styles.label}>Server address</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={(t) => {
            setServerUrl(t);
            setError(null);
          }}
          placeholder={Platform.OS === "android" ? "10.0.2.2 (emulator) or 192.168.x.x" : "192.168.1.5 or http://192.168.1.5:8080"}
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={styles.inputWrap}>
        <Text style={styles.label}>Game code</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={(t) => {
            setCode(t.toUpperCase().slice(0, 6));
            setError(null);
          }}
          placeholder="ABC123"
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          maxLength={6}
        />
      </View>
      <View style={styles.inputWrap}>
        <Text style={styles.label}>Password (optional)</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError(null);
          }}
          placeholder="If host set a password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          maxLength={20}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <SoundPressable
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleFind}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{buttonLabel}</Text>
        )}
      </SoundPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  hint: {
    fontSize: 13,
    color: UI_BODY_MUTED,
    marginBottom: 8,
  },
  emulatorHint: {
    fontSize: 12,
    color: UI_PRIMARY,
    marginBottom: 10,
    fontStyle: "italic",
  },
  inputWrap: { marginBottom: 12 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: UI_PRIMARY,
    marginBottom: 4,
  },
  input: {
    backgroundColor: UI_WHITE,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#e2e6ea",
  },
  codeInput: {
    letterSpacing: 4,
    fontSize: 20,
    fontWeight: "700",
  },
  error: {
    fontSize: 13,
    color: "#c62828",
    marginBottom: 8,
  },
  btn: {
    backgroundColor: UI_PRIMARY,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: UI_WHITE,
  },
});
