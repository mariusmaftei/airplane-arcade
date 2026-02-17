import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import {
  UI_PRIMARY,
  UI_WHITE,
} from "../constants/constants";
import SoundPressable from "./SoundPressable";

const STATUS_CONNECTED = "connected";
const STATUS_PLACING = "placing";
const STATUS_WAITING = "waiting";
const STATUS_READY = "ready";

export default function LanHostLobby({
  lobbyCode,
  hostIp,
  hostName = "You",
  maxPlayers = 2,
  joiningPlayer = null,
  connectedPlayerName = null,
  allPlayers = [],
  hostReady = false,
  onHostReady,
  joinerReady = false,
  onJoinerReady,
  isJoiner = false,
}) {
  const [dots, setDots] = useState("");
  const pulseAnim = useState(new Animated.Value(1))[0];
  const barAnim = useState(new Animated.Value(0))[0];
  const useAllPlayers = allPlayers?.length > 0;
  const connectedCount = useAllPlayers ? allPlayers.filter((p) => p.connected).length : (connectedPlayerName ? 2 : joiningPlayer ? 1 : 1);
  const p2Status = connectedPlayerName
    ? (joinerReady ? STATUS_READY : STATUS_CONNECTED)
    : joiningPlayer
      ? STATUS_PLACING
      : STATUS_WAITING;
  const p2Name = connectedPlayerName || joiningPlayer?.name;

  useEffect(() => {
    const id = setInterval(
      () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
      400,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(barAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(barAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [barAnim]);

  const PlayerRow = ({ name, status }) => (
    <View style={styles.playerRow}>
      <View
        style={[
          styles.statusDot,
          (status === STATUS_CONNECTED || status === STATUS_READY) && styles.statusDotConnected,
          status === STATUS_PLACING && styles.statusDotPlacing,
        ]}
      />
      <Text style={styles.playerName} numberOfLines={1}>
        {name || "—"}
      </Text>
      <Text
        style={[
          styles.playerStatus,
          (status === STATUS_CONNECTED || status === STATUS_READY) && styles.playerStatusConnected,
          status === STATUS_PLACING && styles.playerStatusPlacing,
        ]}
      >
        {status === STATUS_READY
          ? "Ready"
          : status === STATUS_CONNECTED
            ? "Connected"
            : status === STATUS_PLACING
              ? "Placing planes..."
              : "Waiting..."}
        {status === STATUS_WAITING ? dots : ""}
      </Text>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.iconText}>📶</Text>
          <Text style={styles.title}>
            {isJoiner ? "Connecting" : "Hosting game"}
          </Text>
        </View>
        <View style={styles.playersSection}>
          <Text style={styles.playersLabel}>
            Players ({isJoiner ? connectedCount : connectedCount}/{maxPlayers})
          </Text>
          {useAllPlayers ? (
            allPlayers.map((p, i) => {
              const isFirstWaiting = !p.connected && !allPlayers.some((prev, j) => j < i && !prev.connected);
              const status = p.connected
                ? (p.ready ? STATUS_READY : STATUS_CONNECTED)
                : joiningPlayer && isFirstWaiting
                  ? STATUS_PLACING
                  : STATUS_WAITING;
              const slotNum = p.id.replace("player", "");
              const name = p.connected
                ? (p.id === "player1" ? (p.name ? `${p.name} (Host)` : "Host") : (p.name || p.id))
                : status === STATUS_PLACING
                  ? (joiningPlayer?.name || `Slot ${slotNum}`)
                  : `Slot ${slotNum}`;
              return (
                <PlayerRow
                  key={p.id}
                  name={status !== STATUS_WAITING ? name : null}
                  status={status}
                />
              );
            })
          ) : isJoiner ? (
            <>
              <PlayerRow name="Host" status={hostReady ? STATUS_READY : STATUS_WAITING} />
              <PlayerRow name={hostName} status={joinerReady ? STATUS_READY : STATUS_CONNECTED} />
            </>
          ) : (
            <>
              <PlayerRow
                name={hostName}
                status={hostReady ? STATUS_READY : STATUS_CONNECTED}
              />
              {maxPlayers >= 2 && (
                <PlayerRow
                  name={p2Status !== STATUS_WAITING ? p2Name : null}
                  status={p2Status}
                />
              )}
            </>
          )}
        </View>
        {!isJoiner && (
          <>
            <View style={styles.divider} />
            <Text style={styles.codeLabel}>Share this code</Text>
            <View style={styles.codeWrap}>
              <Text style={styles.code}>{lobbyCode || "------"}</Text>
            </View>
            <View style={styles.serverRow}>
              <Text style={styles.serverIcon}>●</Text>
              <Text style={styles.serverText}>{hostIp || "—"}</Text>
            </View>
          </>
        )}
        {isJoiner ? (
          <>
            {onJoinerReady && (
              <SoundPressable
                style={({ pressed }) => [
                  styles.readyBtn,
                  joinerReady && styles.readyBtnDone,
                  pressed && !joinerReady && { opacity: 0.9 },
                ]}
                onPress={joinerReady ? undefined : onJoinerReady}
                disabled={joinerReady}
              >
                <Text style={styles.readyBtnText}>
                  {joinerReady ? "Ready ✓" : "Ready"}
                </Text>
              </SoundPressable>
            )}
            {joinerReady && !hostReady && (
              <Text style={styles.waitingText}>
                Waiting for host{dots}
              </Text>
            )}
            <View style={[styles.bar, { marginTop: 16 }]}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    opacity: barAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 1],
                    }),
                  },
                ]}
              />
            </View>
          </>
        ) : onHostReady && (
          <SoundPressable
            style={({ pressed }) => [
              styles.readyBtn,
              hostReady && styles.readyBtnDone,
              pressed && !hostReady && { opacity: 0.9 },
            ]}
            onPress={hostReady ? undefined : onHostReady}
            disabled={hostReady}
          >
            <Text style={styles.readyBtnText}>
              {hostReady ? "Ready ✓" : "Ready"}
            </Text>
          </SoundPressable>
        )}
        {!isJoiner && (
          <View style={[styles.bar, { marginTop: 16 }]}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  opacity: barAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 1],
                  }),
                },
              ]}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  card: {
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  iconText: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: UI_WHITE,
  },
  playersSection: {
    width: "100%",
    marginBottom: 16,
  },
  playersLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 8,
    fontWeight: "600",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    marginBottom: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  statusDotConnected: {
    backgroundColor: "#4ade80",
  },
  statusDotPlacing: {
    backgroundColor: "#fbbf24",
  },
  playerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: UI_WHITE,
  },
  playerStatus: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  playerStatusConnected: {
    color: "#4ade80",
    fontWeight: "600",
  },
  playerStatusPlacing: {
    color: "#fbbf24",
    fontWeight: "600",
  },
  serverIcon: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 10,
  },
  codeWrap: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: UI_PRIMARY,
    minWidth: 200,
    alignItems: "center",
  },
  code: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 8,
    color: UI_WHITE,
  },
  serverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  serverText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  bar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: UI_PRIMARY,
    borderRadius: 2,
  },
  readyBtn: {
    backgroundColor: UI_PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 8,
  },
  readyBtnDone: {
    backgroundColor: "rgba(74, 222, 128, 0.5)",
    opacity: 0.9,
  },
  readyBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: UI_WHITE,
  },
  waitingText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    marginTop: 16,
    textAlign: "center",
  },
});
