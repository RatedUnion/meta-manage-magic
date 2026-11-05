import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ViewModeState = { viewOnly: boolean; setViewOnly: (v: boolean) => void };

const ViewModeContext = createContext<ViewModeState>({ viewOnly: false, setViewOnly: () => {} });
const KEY = "duaa-affiliate-view";

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewOnly, setState] = useState(false);
  useEffect(() => {
    setState(window.localStorage.getItem(KEY) === "1");
  }, []);
  const setViewOnly = (v: boolean) => {
    window.localStorage.setItem(KEY, v ? "1" : "0");
    setState(v);
  };
  return <ViewModeContext.Provider value={{ viewOnly, setViewOnly }}>{children}</ViewModeContext.Provider>;
}

export const useViewMode = () => useContext(ViewModeContext);
