import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { UI_PRIMARY } from "../constants/constants";

export default function VersusScreen({ leftName, rightName, mapImage }) {
  const content = (
    <View style={styles.whiteBox}>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {leftName}
        </Text>
        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {rightName}
        </Text>
      </View>
    </View>
  );
  if (mapImage) {
    return (
      <ImageBackground source={mapImage} style={styles.container}>
        {content}
      </ImageBackground>
    );
  }
  return (
    <View style={[styles.container, styles.containerDefault]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UI_PRIMARY,
  },
  containerDefault: {
    backgroundColor: "transparent",
  },
  whiteBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 28,
    marginHorizontal: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000",
    maxWidth: 120,
    textAlign: "center",
  },
  vsBadge: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  vsText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 2,
  },
});
