"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreList } from "@/components/store-list";
import { StoreMapWrapper } from "@/components/store-map-wrapper";
import { MapIcon, ListIcon, Plus, FileText } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

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
    contract_file_url: "",
    city_id: null,
    latitude: null,
    longitude: null,
  });
  const [cities, setCities] = useState<CityData[]>([]);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newStoreAddressFields, setNewStoreAddressFields] = useState({
    country: '',
    city: '',
    detailedAddress: '',
    postalCode: '',
  });

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

  // Geocoding function using Nominatim API
  const geocodeAddress = async (address: string): Promise<{
    latitude: number;
    longitude: number;
    cityName: string | null;
    country: string | null;
  } | null> => {
    try {
      const cleanedAddress = address.trim().replace(/\s+/g, ' ').replace(/,+/g, ',');
      console.log('Geocoding address:', cleanedAddress);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanedAddress)}&format=json&addressdetails=1&limit=1&accept-language=zh`,
        {
          headers: {
            'User-Agent': 'StoreMapApp (your-email@example.com)',
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Nominatim response:', data);

      if (data.length === 0) {
        throw new Error("No results found for the address. Ensure the address is detailed and correctly formatted.");
      }

      const result = data[0];
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);
      const cityName = result.address.city || result.address.town || result.address.village || null;
      const country = result.address.country || null;

      if (!latitude || !longitude) {
        throw new Error("Invalid coordinates returned");
      }

      return {
        latitude,
        longitude,
        cityName,
        country,
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  };

  // Contract file processing function
  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setContractFile(e.target.files[0]);
    }
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
      const bucketName = "csentio-contracts";
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

    if (!newStoreAddressFields.country?.trim() || !newStoreAddressFields.city?.trim()) {
      setValidationError("Country and city are required");
      toast.error("Country and city are required");
      return;
    }

    setValidationError(null);
    setIsLoading(true);

    try {
      // Combine address fields
      const addressParts = [];
      if (newStoreAddressFields.detailedAddress) addressParts.push(newStoreAddressFields.detailedAddress);
      if (newStoreAddressFields.city) addressParts.push(newStoreAddressFields.city);
      if (newStoreAddressFields.country) addressParts.push(newStoreAddressFields.country);
      if (newStoreAddressFields.postalCode) addressParts.push(newStoreAddressFields.postalCode);
      const fullAddress = addressParts.join(', ');

      let latitude: number | null = null;
      let longitude: number | null = null;
      let cityId: number | null = null;

      if (fullAddress.trim()) {
        const geocodedData = await geocodeAddress(fullAddress);
        if (geocodedData) {
          latitude = geocodedData.latitude;
          longitude = geocodedData.longitude;
          const cityName = geocodedData.cityName;
          const country = geocodedData.country;

          if (cityName) {
            const matchedCity = cities.find(city => 
              city.city_name.toLowerCase() === cityName.toLowerCase()
            );

            if (matchedCity) {
              cityId = matchedCity.id;
            } else {
              const { data: newCityData, error: cityError } = await supabase
                .from('cities')
                .insert({
                  city_name: cityName,
                  country: country || newStoreAddressFields.country || 'Unknown',
                })
                .select();

              if (cityError) throw cityError;

              if (newCityData && newCityData[0]) {
                setCities([...cities, newCityData[0]]);
                cityId = newCityData[0].id;
              }
            }
          }
        }
      }

      let fileUrl = null;
      if (contractFile) {
        const tempId = Date.now();
        fileUrl = await uploadContractFile(contractFile, tempId);
      }

      const { data, error } = await supabase
        .from("stores")
        .insert({
          store_name: newStore.store_name,
          address: fullAddress,
          contact_info: newStore.contact_info,
          is_active: true, // Default Active
          latitude,
          longitude,
          city_id: cityId,
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
        contract_file_url: "",
        city_id: null,
        latitude: null,
        longitude: null,
      });
      setNewStoreAddressFields({
        country: '',
        city: '',
        detailedAddress: '',
        postalCode: '',
      });
    } catch (error) {
      console.error("Error saving store:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save store. Check the address and try again.");
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
      contract_file_url: "",
      city_id: null,
      latitude: null,
      longitude: null,
    });
    setNewStoreAddressFields({
      country: '',
      city: '',
      detailedAddress: '',
      postalCode: '',
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
        <DialogContent className="sm:max-w-md max-h-[80vh] rounded-md border overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
            <DialogDescription>Enter the details for the new store location.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] w-full">
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="newStoreName">Store Name</Label>
              <Input
                id="newStoreName"
                placeholder="e.g., Store Name"
                value={newStore.store_name || ""}
                onChange={handleStoreNameChange}
                className={validationError === "Store name is required" ? "border-destructive" : ""}
              />
              {validationError === "Store name is required" && (
                <p className="text-sm text-destructive">Store name is required</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="newCountry" className="text-sm font-normal mb-1 text-muted-foreground">Country</Label>
                    <Input 
                      id="newCountry" 
                      placeholder="e.g., China"
                      value={newStoreAddressFields.country}
                      onChange={(e) => setNewStoreAddressFields({ ...newStoreAddressFields, country: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="newCity" className="text-sm font-normal mb-1 text-muted-foreground">City</Label>
                    <Input 
                      id="newCity" 
                      placeholder="e.g., Shanghai"
                      value={newStoreAddressFields.city}
                      onChange={(e) => setNewStoreAddressFields({ ...newStoreAddressFields, city: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="newDetailedAddress" className="text-sm font-normal mb-1 text-muted-foreground">Detailed Address</Label>
                  <Input 
                    id="newDetailedAddress" 
                    placeholder="e.g., 123 Nanjing East Road, Huangpu District"
                    value={newStoreAddressFields.detailedAddress}
                    onChange={(e) => setNewStoreAddressFields({ ...newStoreAddressFields, detailedAddress: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="newPostalCode" className="text-sm font-normal mb-1 text-muted-foreground">Postal Code (Optional)</Label>
                  <Input 
                    id="newPostalCode" 
                    placeholder="Enter postal code"
                    value={newStoreAddressFields.postalCode}
                    onChange={(e) => setNewStoreAddressFields({ ...newStoreAddressFields, postalCode: e.target.value })}
                  />
                </div>
              </div>
              {validationError === "Address is required" && (
                <p className="text-sm text-destructive">Address is required</p>
              )}
              {validationError === "Country and city are required" && (
                <p className="text-sm text-destructive">Country and city are required</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newContactInfo">Contact Info</Label>
              <Input
                id="newContactInfo"
                placeholder="Enter contact information"
                value={newStore.contact_info || ""}
                onChange={handleContactInfoChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newContractInfo">Contract Info</Label>
              <Textarea
                id="newContractInfo"
                placeholder="Enter contract details"
                value={newStore.contract_info || ""}
                onChange={handleContractInfoChange}
              />
            </div>
            <ContractFileComponent />
            </div>
          </ScrollArea>
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