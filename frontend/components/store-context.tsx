"use client";

import * as React from "react";
import { useContext } from "react";

// Define the view mode type
export type StoreViewMode = "map" | "list";

// Create context to manage store view mode globally
export const StoreViewContext = React.createContext({
  viewMode: "map" as StoreViewMode,
  storeId: null as number | null,
  isAddStoreOpen: false,
  setViewMode: (() => {}) as React.Dispatch<React.SetStateAction<StoreViewMode>>,
  setStoreId: (() => {}) as React.Dispatch<React.SetStateAction<number | null>>,
  setIsAddStoreOpen: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
});

// StoreViewProvider component to provide context
export function StoreViewProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = React.useState<StoreViewMode>("map");
  const [storeId, setStoreId] = React.useState<number | null>(null);
  const [isAddStoreOpen, setIsAddStoreOpen] = React.useState(false);
  
  return (
    <StoreViewContext.Provider value={{ 
      viewMode, 
      storeId, 
      isAddStoreOpen, 
      setViewMode, 
      setStoreId, 
      setIsAddStoreOpen 
    }}>
      {children}
    </StoreViewContext.Provider>
  );
}

// Custom hook to use the store view context
export function useStoreView() {
  const context = useContext(StoreViewContext);
  if (!context) {
    throw new Error("useStoreView must be used within a StoreViewProvider");
  }
  return context;
} 