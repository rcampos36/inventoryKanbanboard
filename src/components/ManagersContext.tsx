"use client";

import { createContext, useContext } from "react";
import type { Manager } from "@/lib/types";

const ManagersContext = createContext<Manager[]>([]);

export function ManagersProvider({
  managers,
  children,
}: {
  managers: Manager[];
  children: React.ReactNode;
}) {
  return (
    <ManagersContext.Provider value={managers}>
      {children}
    </ManagersContext.Provider>
  );
}

export function useManagers(): Manager[] {
  return useContext(ManagersContext);
}
