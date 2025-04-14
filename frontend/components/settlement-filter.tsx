"use client";

import * as React from "react";
import { useContext } from "react";
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

// 模拟商店数据
const stores = [
  { id: "all", name: "All Stores" },
  { id: "store-a", name: "Store A" },
  { id: "store-b", name: "Store B" },
  { id: "store-c", name: "Store C" },
];

// 创建Context来全局管理Settlement的视图模式
export const SettlementViewContext = React.createContext<{
  viewMode: "total" | "by-store";
  storeId: string;
  setViewMode: React.Dispatch<React.SetStateAction<"total" | "by-store">>;
  setStoreId: React.Dispatch<React.SetStateAction<string>>;
}>({
  viewMode: "total",
  storeId: "all",
  setViewMode: () => {},
  setStoreId: () => {},
});

// 创建一个hook来使用Settlement视图模式Context
export function useSettlementView() {
  const context = useContext(SettlementViewContext);
  if (!context) {
    throw new Error("useSettlementView must be used within a SettlementViewProvider");
  }
  return context;
}

export function SettlementFilter() {
  // 使用上级组件提供的Context
  const { viewMode, storeId, setViewMode, setStoreId } = useSettlementView();

  return (
    <div className="flex items-center gap-4">
      <Tabs 
        value={viewMode} 
        onValueChange={(value) => setViewMode(value as "total" | "by-store")}
        className="w-[240px]"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="total">Total</TabsTrigger>
          <TabsTrigger value="by-store">By Store</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === "by-store" && (
        <Select value={storeId} onValueChange={setStoreId}>
          <SelectTrigger className="w-[180px]">
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
  );
} 