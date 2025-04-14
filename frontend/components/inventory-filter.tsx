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

// 模拟商店数据
const stores = [
  { id: "all", name: "All Stores" },
  { id: "store-a", name: "Store A" },
  { id: "store-b", name: "Store B" },
  { id: "store-c", name: "Store C" },
];

// 创建一个context来全局管理Inventory的视图模式
export const InventoryViewContext = React.createContext<{
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

export function InventoryFilter() {
  const [viewMode, setViewMode] = React.useState<"total" | "by-store">("total");
  const [storeId, setStoreId] = React.useState("all");

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