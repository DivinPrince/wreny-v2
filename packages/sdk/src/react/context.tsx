import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Sdk } from "../index";

const ApiContext = createContext<Sdk | null>(null);

export type ApiProviderProps = {
  api: Sdk;
  children: ReactNode;
};

/**
 * Provides the API client to the tree. Wrap your app (or a subtree) with this
 * so hooks like useAgentChat can access the SDK.
 */
export function ApiProvider({ api, children }: ApiProviderProps) {
  const value = useMemo(() => api, [api]);
  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}

/**
 * Get the API client from context. Throws if used outside ApiProvider.
 */
export function useApi(): Sdk {
  const api = useContext(ApiContext);
  if (!api) {
    throw new Error("useApi must be used within ApiProvider");
  }
  return api;
}
