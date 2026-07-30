"use client";

import { createContext, useContext } from "react";
import { getColumns, getModelColumns, INTAKE_COLUMNS } from "@/lib/data";
import type { Column } from "@/lib/types";

type BoardConfig = {
  brand: string;
  modelColumns: Column[];
  intakeColumns: Column[];
  columns: Column[];
};

const BoardConfigContext = createContext<BoardConfig>({
  brand: "Mazda",
  modelColumns: getModelColumns("Mazda"),
  intakeColumns: INTAKE_COLUMNS,
  columns: getColumns("Mazda"),
});

export function BoardConfigProvider({
  brand,
  children,
}: {
  brand: string;
  children: React.ReactNode;
}) {
  const value: BoardConfig = {
    brand,
    modelColumns: getModelColumns(brand),
    intakeColumns: INTAKE_COLUMNS,
    columns: getColumns(brand),
  };
  return (
    <BoardConfigContext.Provider value={value}>
      {children}
    </BoardConfigContext.Provider>
  );
}

export function useBoardConfig(): BoardConfig {
  return useContext(BoardConfigContext);
}
