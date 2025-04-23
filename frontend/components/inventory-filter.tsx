"use client";

import * as React from "react";
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
import { API_BASE_URL, fetchStores, StoresInfo } from "@/lib/api";
import { useEffect } from "react";

// 创建一个context来全局管理Inventory的视图模式
export type ViewMode = "total" | "by-store";

export const InventoryViewContext = React.createContext({
  viewMode: "total" as ViewMode,
  storeId: "all",
  setViewMode: (() => {}) as React.Dispatch<React.SetStateAction<ViewMode>>,
  setStoreId: (() => {}) as React.Dispatch<React.SetStateAction<string>>,
});

export function InventoryFilter() {
  const [viewMode, setViewMode] = React.useState<"total" | "by-store">("total");
  const [storeId, setStoreId] = React.useState("all"); // 初始值可以是 "all"
  const [stores, setStores] = React.useState<StoresInfo[]>([]);

  useEffect(() => {
    const fetchStoresData = async () => {
      try {
        const storesData = await fetchStores();
        console.log("Fetched stores:", storesData);

        // 检查是否有重复的 store.id
        const storeIds = storesData.map((store) => store.id);
        const uniqueStoreIds = new Set(storeIds);
        if (storeIds.length !== uniqueStoreIds.size) {
          console.warn("Duplicate store IDs found:", storeIds);
        }

        setStores(storesData);
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    };
    fetchStoresData();
  }, []);

  return (
    <InventoryViewContext.Provider value={{ viewMode, storeId, setViewMode, setStoreId }}>
      <div className="flex items-center gap-4">
        <Tabs
          value={viewMode}
          onValueChange={(value) => {
            setViewMode(value as "total" | "by-store");
            if (value === "total") {
              setStoreId("all"); // 当切换到 "Total" 模式时，重置 storeId
            }
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
            onValueChange={(value) => {
              setStoreId(value); // 单选，确保只设置一个值
            }}
          >
            <SelectTrigger className="w-[180px] h-[40px] border-muted">
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Stores</SelectLabel>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>
    </InventoryViewContext.Provider>
  );
}