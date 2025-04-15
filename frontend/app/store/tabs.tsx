"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreList } from "@/components/store-list";
import { StoreMapWrapper } from "@/components/store-map-wrapper";
import { MapIcon, ListIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreView } from "@/components/store-context";

export function StoreTabs() {
  const { viewMode, isAddStoreOpen, setViewMode, setIsAddStoreOpen } = useStoreView();
  
  const handleAddStore = () => {
    setIsAddStoreOpen(true);
  };
  
  return (
    <div className="w-full space-y-4">      
      <Tabs 
        defaultValue="map" 
        value={viewMode}
        onValueChange={(value) => setViewMode(value as "map" | "list")}
        className="w-full"
      >
        <div className="flex mb-4">
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
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="gap-1" onClick={handleAddStore}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
        
        <TabsContent value="map" className="m-0">
          <StoreMapWrapper className="h-[calc(100vh-240px)]" />
        </TabsContent>
        
        <TabsContent value="list" className="m-0">
          <StoreList />
        </TabsContent>
      </Tabs>
    </div>
    
  );
} 