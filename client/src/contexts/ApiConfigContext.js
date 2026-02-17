import { createContext, useContext, useState } from "react";
import { Platform } from "react-native";

const DEFAULT =
  Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";

const ApiConfigContext = createContext(null);

export function ApiConfigProvider({ children }) {
  const [serverUrlOverride, setServerUrlOverride] = useState(null);
  const baseUrl = serverUrlOverride || process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT;
  return (
    <ApiConfigContext.Provider
      value={{
        baseUrl,
        setServerUrlOverride,
        resetServerUrl: () => setServerUrlOverride(null),
      }}
    >
      {children}
    </ApiConfigContext.Provider>
  );
}

export function useApiConfig() {
  const ctx = useContext(ApiConfigContext);
  return ctx ?? { baseUrl: DEFAULT, setServerUrlOverride: () => {} };
}
