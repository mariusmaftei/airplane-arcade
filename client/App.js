import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Component, useEffect } from "react";
import GameScreen from "./src/screens/GameScreen.js";

if (typeof global !== "undefined" && global.Updates) {
  global.Updates.checkForUpdateAsync = () => Promise.resolve({ isAvailable: false });
  global.Updates.fetchUpdateAsync = () => Promise.resolve({ isNew: false });
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error);
    console.error("Error Stack:", error.stack);
    console.error("Component Stack:", errorInfo.componentStack);
    this.setState({ 
      hasError: true, 
      error: error,
      errorInfo: errorInfo 
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || "Unknown error"}
          </Text>
          {this.state.error?.stack && (
            <Text style={styles.errorStack} numberOfLines={10}>
              {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
            </Text>
          )}
          <Text style={styles.errorHint}>
            Check the console for full details
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <GameScreen />
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#faf8f5",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 12,
  },
  errorStack: {
    fontSize: 10,
    color: "#999",
    fontFamily: "monospace",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
  },
});
