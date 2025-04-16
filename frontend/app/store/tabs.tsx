"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreList } from "@/components/store-list";
import { StoreMapWrapper } from "@/components/store-map-wrapper";
import { MapIcon, ListIcon, Plus, Store, MapPin, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreView } from "@/components/store-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function StoreTabs() {
  const { viewMode, isAddStoreOpen, setViewMode, setIsAddStoreOpen, setStoreId } = useStoreView();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newStore, setNewStore] = React.useState({
    store_name: "",
    address: "",
    contact_info: "",
    contract_info: "",
    documents: [] as string[]
  });
  
  // Handle dialog open state
  React.useEffect(() => {
    if (isAddStoreOpen) {
      setIsAddDialogOpen(true);
      setIsAddStoreOpen(false);
    }
  }, [isAddStoreOpen, setIsAddStoreOpen]);
  
  const handleAddStore = () => {
    setIsAddDialogOpen(true);
  };
  
  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      // Reset the form when dialog is closed
      setNewStore({
        store_name: "",
        address: "",
        contact_info: "",
        contract_info: "",
        documents: []
      });
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileNames = Array.from(e.target.files).map(file => file.name);
      setNewStore({
        ...newStore,
        documents: [...newStore.documents, ...fileNames]
      });
    }
  };
  
  const handleSaveStore = () => {
    // Here you would save the store to your backend
    console.log("Saving store:", newStore);
    setIsAddDialogOpen(false);
  };

  // Function to handle view mode changes
  const handleViewModeChange = (value: string) => {
    setViewMode(value as "map" | "list");
    // Reset storeId when changing views to prevent edit dialog from appearing
    setStoreId(null);
  };
  
  return (
    <div className="w-full space-y-4">      
      <Tabs 
        defaultValue="map" 
        value={viewMode}
        onValueChange={handleViewModeChange}
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
      
      {/* Add Store Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
            <DialogDescription>
              Enter the details for the new store location.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input 
                id="store-name" 
                placeholder="Enter store name"
                value={newStore.store_name}
                onChange={(e) => setNewStore({...newStore, store_name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea 
                id="address" 
                placeholder="Enter store address"
                value={newStore.address}
                onChange={(e) => setNewStore({...newStore, address: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Info</Label>
              <Input 
                id="contact" 
                placeholder="Enter contact info"
                value={newStore.contact_info}
                onChange={(e) => setNewStore({...newStore, contact_info: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contract-info">Contract Info</Label>
              <Textarea 
                id="contract-info" 
                placeholder="Enter contract details"
                value={newStore.contract_info}
                onChange={(e) => setNewStore({...newStore, contract_info: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="documents">Attachments</Label>
              <Input 
                id="documents" 
                type="file" 
                multiple
                onChange={handleFileChange}
              />
              {newStore.documents.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1">Selected files:</p>
                  <div className="flex flex-wrap gap-2">
                    {newStore.documents.map((doc, i) => (
                      <Badge key={i} variant="outline" className="flex gap-1 items-center">
                        <FileText className="h-3 w-3" />
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveStore}>Save Store</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 