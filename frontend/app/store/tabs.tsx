"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreList } from "@/components/store-list";
import { StoreMapWrapper } from "@/components/store-map-wrapper";
import { MapIcon, ListIcon, Plus, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreView } from "@/components/store-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import supabase from "@/lib/supabase";
import { toast } from "sonner";

// Define the store data structure
interface StoreData {
  store_id: number;
  store_name: string;
  address: string;
  contact_info: string;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  city_id: number | null;
  created_at: string;
  updated_at: string;
  contract_file_url?: string;
  contract_info?: string;
}

// Add city data structure
interface CityData {
  id: number;
  city_name: string;
  country: string;
}

export function StoreTabs() {
  const { viewMode, setViewMode, setStoreId } = useStoreView();
  const [isAddStoreDialogOpen, setIsAddStoreDialogOpen] = useState(false);
  const [newStore, setNewStore] = useState<Partial<StoreData>>({
    store_name: "",
    address: "",
    contact_info: "",
    is_active: true,
    contract_info: "",
    city_id: null,
    latitude: null,
    longitude: null,
  });
  const [cities, setCities] = useState<CityData[]>([]);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch city list
  useEffect(() => {
    async function fetchCities() {
      try {
        const { data, error } = await supabase
          .from("cities")
          .select("*")
          .order("city_name");

        if (error) throw error;

        if (data) {
          setCities(data);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        toast.error("Failed to fetch cities");
      }
    }

    fetchCities();
  }, []);

  // Enhanced address processing function with geocoding
  const handleAddressChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const address = e.target.value;
    setNewStore({ ...newStore, address });

    // Extract city name from address
    const cityMatch = address.match(/([^,]+), China/);
    if (cityMatch && cityMatch[1]) {
      const cityName = cityMatch[1].trim();

      // Find matching city
      const matchedCity = cities.find(
        (city) => city.city_name.toLowerCase() === cityName.toLowerCase()
      );

      if (matchedCity) {
        const coordinates = getCityCoordinates(cityName);
        setNewStore({
          ...newStore,
          city_id: matchedCity.id,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        });
      }
    }
  };

  // Simple city coordinate mapping (in real app, use geocode API)
  const getCityCoordinates = (cityName: string) => {
    const coordinates: { [key: string]: { lat: number; lng: number } } = {
      Shanghai: { lat: 31.2304, lng: 121.4737 },
      Beijing: { lat: 39.9042, lng: 116.4074 },
      Guangzhou: { lat: 23.1291, lng: 113.2644 },
      Shenzhen: { lat: 22.5431, lng: 114.0579 },
      Chengdu: { lat: 30.5728, lng: 104.0668 },
      Hangzhou: { lat: 30.2741, lng: 120.1551 },
    };

    // Case insensitive lookup
    const normalizedCityName = cityName.toLowerCase();
    for (const [key, value] of Object.entries(coordinates)) {
      if (key.toLowerCase() === normalizedCityName) {
        return value;
      }
    }

    // If not found, use default China center
    return { lat: 35.8617, lng: 104.1954 };
  };

  // Contract file processing function
  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setContractFile(e.target.files[0]);
    }
  };

  // Handle file removal
  const handleRemoveContractFile = () => {
    setContractFile(null);
  };

  // Ensure the Supabase bucket exists
  const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });

        if (error) {
          console.error("Error creating bucket:", error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error ensuring bucket exists:", error);
      return false;
    }
  };

  // Upload contract file to Supabase storage
  const uploadContractFile = async (file: File, storeId: number): Promise<string | null> => {
    try {
      const bucketName = "store_contracts";
      const bucketExists = await ensureBucketExists(bucketName);

      if (!bucketExists) {
        throw new Error("Failed to ensure bucket exists");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${storeId}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      const { error } = await supabase.storage.from(bucketName).upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading contract file:", error);
      toast.error("Failed to upload file");
      return null;
    }
  };

  // Add processing functions
  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewStore({ ...newStore, store_name: e.target.value });
  };

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewStore({ ...newStore, contact_info: e.target.value });
  };

  const handleContractInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewStore({ ...newStore, contract_info: e.target.value });
  };

  // Enhanced save function with validation
  const handleSaveStore = async () => {
    // Validate required fields
    if (!newStore?.store_name?.trim()) {
      setValidationError("Store name is required");
      toast.error("Store name is required");
      return;
    }

    if (!newStore?.address?.trim()) {
      setValidationError("Address is required");
      toast.error("Address is required");
      return;
    }

    setValidationError(null);
    setIsLoading(true);

    try {
      let fileUrl = null;
      if (contractFile) {
        const tempId = Date.now();
        fileUrl = await uploadContractFile(contractFile, tempId);
      }

      const { data, error } = await supabase
        .from("stores")
        .insert({
          store_name: newStore.store_name,
          address: newStore.address,
          contact_info: newStore.contact_info,
          is_active: true, // Default Active
          latitude: newStore.latitude,
          longitude: newStore.longitude,
          city_id: newStore.city_id,
          contract_info: newStore.contract_info,
          contract_file_url: fileUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      if (data && data[0]) {
        toast.success("Store added successfully");
      }

      setIsAddStoreDialogOpen(false);
      setContractFile(null);
      setNewStore({
        store_name: "",
        address: "",
        contact_info: "",
        is_active: true,
        contract_info: "",
        city_id: null,
        latitude: null,
        longitude: null,
      });
    } catch (error) {
      console.error("Error saving store:", error);
      toast.error("Failed to save store");
    } finally {
      setIsLoading(false);
    }
  };

  // Open Add Store Dialog
  const handleAddStore = () => {
    setContractFile(null);
    setNewStore({
      store_name: "",
      address: "",
      contact_info: "",
      is_active: true,
      contract_info: "",
      city_id: null,
      latitude: null,
      longitude: null,
    });
    setIsAddStoreDialogOpen(true);
    setValidationError(null);
  };

  // Function to handle view mode changes
  const handleViewModeChange = (value: string) => {
    setViewMode(value as "map" | "list");
    setStoreId(null);
  };

  // Render file information
  const renderFileInfo = () => {
    if (contractFile) {
      return (
        <Badge variant="outline" className="flex gap-1 items-center">
          <FileText className="h-3 w-3" />
          {contractFile.name}
          {/* <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 ml-1 hover:bg-muted rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveContractFile();
            }}
          >
            <XCircle className="h-3 w-3" />
          </Button> */}
        </Badge>
      );
    } else {
      return <p className="text-sm text-muted-foreground">Click to choose file</p>;
    }
  };

  // Contract file component
  const ContractFileComponent = () => (
    <div className="space-y-2">
      <Label htmlFor="contractFile">Contract File</Label>
      <div className="border rounded-md p-2 relative">
        <div className="flex flex-wrap gap-2">{renderFileInfo()}</div>
        <Input
          id="contractFile"
          type="file"
          accept=".pdf,.doc,.docx,.pages"
          onChange={handleContractFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );

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
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleAddStore}
            >
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

      {/* Add New Store Dialog */}
      <Dialog
        open={isAddStoreDialogOpen}
        onOpenChange={(open) => {
          setIsAddStoreDialogOpen(open);
          if (!open) setValidationError(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-background">
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
            <DialogDescription>Enter the details for the new store location.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newStoreName">Store Name</Label>
              <Input
                id="newStoreName"
                placeholder="Enter store name"
                value={newStore.store_name || ""}
                onChange={handleStoreNameChange}
                className={validationError === "Store name is required" ? "border-destructive" : ""}
              />
              {validationError === "Store name is required" && (
                <p className="text-sm text-destructive">Store name is required</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newAddress">Address</Label>
              <Textarea
                id="newAddress"
                placeholder="Enter store address (e.g. 123 Street, Shanghai, China)"
                value={newStore.address || ""}
                onChange={handleAddressChange}
                className={validationError === "Address is required" ? "border-destructive" : ""}
              />
              {validationError === "Address is required" && (
                <p className="text-sm text-destructive">Address is required</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newContactInfo">Contact Information</Label>
              <Input
                id="newContactInfo"
                placeholder="Enter contact information"
                value={newStore.contact_info || ""}
                onChange={handleContactInfoChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newContractInfo">Contract Information</Label>
              <Textarea
                id="newContractInfo"
                placeholder="Enter contract details"
                value={newStore.contract_info || ""}
                onChange={handleContractInfoChange}
              />
            </div>
            <ContractFileComponent />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddStoreDialogOpen(false);
                setValidationError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveStore} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Store"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}