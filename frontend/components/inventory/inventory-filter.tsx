// components/inventory-filter.tsx
'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StoresInfo, fetchStores } from '@/lib/api';
export type ViewMode = "total" | "by-store";

// 定义上下文的类型
interface InventoryViewContextType {
  viewMode: ViewMode;
  storeId: string;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  setStoreId: React.Dispatch<React.SetStateAction<string>>;
  stores: StoresInfo[];
  isLoading: boolean;
}

// 更新上下文的默认值
export const InventoryViewContext = React.createContext<InventoryViewContextType>({
  viewMode: "total",
  storeId: "all",
  setViewMode: () => {},
  setStoreId: () => {},
  stores: [],
  isLoading: false,
});

export function InventoryFilter() {
  const { viewMode, setViewMode, storeId, setStoreId, stores, isLoading } = React.useContext(InventoryViewContext);

  return (
    <div className="flex items-center gap-4">
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-[240px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="total">Total</TabsTrigger>
          <TabsTrigger value="by-store">By Store</TabsTrigger>
        </TabsList>
      </Tabs>
      {viewMode === "by-store" && (
        <Select value={storeId} onValueChange={setStoreId} disabled={isLoading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={isLoading ? 'Loading...' : 'Select store'} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Stores</SelectLabel>
              <SelectItem key="all" value="all">
                All Stores
              </SelectItem>
              {stores.map((store) => (
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