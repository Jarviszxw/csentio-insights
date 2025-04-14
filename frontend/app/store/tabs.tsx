"use client";

import * as React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreList } from "@/components/store-list";
import { StoreMap } from "@/components/store-map";
import { MapIcon, ListIcon } from "lucide-react";

export function StoreTabs() {
  const [activeTab, setActiveTab] = useState<string>("map");
  
  return (
    <div className="w-full space-y-4">
      <Tabs 
        defaultValue="map" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Store Management</h2>
          <TabsList>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Map View</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <ListIcon className="h-4 w-4" />
              <span className="hidden sm:inline">List View</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="map" className="m-0">
          <StoreMap className="h-[calc(100vh-240px)]" />
        </TabsContent>
        
        <TabsContent value="list" className="m-0">
          <StoreList />
        </TabsContent>
      </Tabs>
    </div>
  );
} 