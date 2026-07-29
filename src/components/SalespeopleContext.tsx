"use client";

import { createContext, useContext } from "react";
import type { Salesperson } from "@/lib/types";

const SalespeopleContext = createContext<Salesperson[]>([]);

export function SalespeopleProvider({
  salespeople,
  children,
}: {
  salespeople: Salesperson[];
  children: React.ReactNode;
}) {
  return (
    <SalespeopleContext.Provider value={salespeople}>
      {children}
    </SalespeopleContext.Provider>
  );
}

export function useSalespeople(): Salesperson[] {
  return useContext(SalespeopleContext);
}
