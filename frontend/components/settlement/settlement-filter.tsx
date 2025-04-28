"use client";

import * as React from "react";
import { useState, useEffect, useContext } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStores as apiFetchStores, StoresInfo } from "@/lib/api";

// Define a type for the store data - Use the imported type or ensure fields match
// interface Store {
//   id: string; // Assuming fetchStores returns id as string
//   name: string;
// }
// Use StoresInfo directly or align local Store type with it
interface Store extends StoresInfo {}

// 创建Context来全局管理Settlement的视图模式
export type ViewMode = "total" | "by-store";

export const SettlementViewContext = React.createContext({
  viewMode: "total" as ViewMode,
  storeId: "all" as string, // Keep 'all' as the initial default/identifier for "All Stores"
  setViewMode: (() => {}) as React.Dispatch<React.SetStateAction<ViewMode>>,
  setStoreId: (() => {}) as React.Dispatch<React.SetStateAction<string>>,
  stores: [] as Store[], // Use updated Store type
  loadingStores: true,
});

// SettlementViewProvider component to provide context
export function SettlementViewProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("total");
  const [storeId, setStoreId] = React.useState("all");
  const [stores, setStores] = useState<Store[]>([]); // Use updated Store type
  const [loadingStores, setLoadingStores] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoadingStores(true);
        // Use the imported authenticated function
        const data: StoresInfo[] = await apiFetchStores(); // Fetch returns StoresInfo[]
        // Data already matches the Store type (which extends StoresInfo)
        
        // Sort stores alphabetically by name before setting state
        const sortedData = [...data].sort((a, b) => 
          a.store_name.localeCompare(b.store_name) // Use store_name
        );
        setStores(sortedData);
        setError(null); // Clear error on success
      } catch (err) {
        console.error("Error fetching stores:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setStores([]); // Clear stores on error
      } finally {
        setLoadingStores(false);
      }
    };

    loadStores();
  }, []); // Empty dependency array ensures this runs once on mount


  return (
    // Pass fetched stores and loading state through context
    <SettlementViewContext.Provider value={{ viewMode, storeId, setViewMode, setStoreId, stores, loadingStores }}>
      {children}
    </SettlementViewContext.Provider>
  );
}

// 创建一个hook来使用Settlement视图模式Context
export function useSettlementView() {
  const context = useContext(SettlementViewContext);
  if (!context) {
    throw new Error("useSettlementView must be used within a SettlementViewProvider");
  }
  return context;
}

export function SettlementFilter() {
  // Use context, including fetched stores and loading state
  const { viewMode, storeId, setViewMode, setStoreId, stores, loadingStores } = useSettlementView();

  // Handle case where stores haven't loaded yet or failed to load
  if (loadingStores) {
    return (
      <div className="flex items-center gap-4">
        <Tabs value="total" className="w-[240px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="total">Total</TabsTrigger>
            <TabsTrigger value="by-store">By Store</TabsTrigger>
          </TabsList>
        </Tabs>
        {/* Show skeleton loader for the select only if viewMode is 'by-store' and loading */}
        {viewMode === 'by-store' && loadingStores && <Skeleton className="h-10 w-[180px]" />}
      </div>
    );
  }
  
  // TODO: Add error handling UI if needed

  return (
    <div className="flex items-center gap-4">
      <Tabs 
        value={viewMode} 
        onValueChange={(value) => {
            setViewMode(value as ViewMode);
            // Reset to 'all' when switching back to 'total' view? Optional.
            // if (value === 'total') setStoreId('all'); 
            // Or reset to 'all' only if current storeId isn't valid anymore?
            // if (value === 'total') setStoreId('all');
            // Reset storeId to 'all' when changing tabs
            setStoreId('all'); 
        }}
        className="w-[240px]"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="total">Total</TabsTrigger>
          <TabsTrigger value="by-store">By Store</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === "by-store" && (
        <Select 
          value={storeId} 
          onValueChange={setStoreId}
          // Disable select if viewMode is not 'by-store' or if loading/error
          disabled={viewMode !== 'by-store' || loadingStores || stores.length === 0} 
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select store" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Stores</SelectLabel>
              <SelectItem key="all" value="all"> 
                All Stores
              </SelectItem>
              {stores.map((store) => (
                // Use store_id (number) as value and store_name as display text
                <SelectItem key={store.store_id} value={String(store.store_id)}> 
                  {store.store_name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </div>
  );
} 