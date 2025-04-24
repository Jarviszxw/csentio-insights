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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
      const attemptGeocode = async (addr: string): Promise<{
        latitude: number;
        longitude: number;
        cityName: string | null;
        country: string | null;
      } | null> => {
        const cleanedAddress = addr.trim().replace(/\s+/g, ' ').replace(/,+/g, ',');
        console.log('Geocoding address:', cleanedAddress);
  
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanedAddress)}&format=json&addressdetails=1&limit=1&accept-language=zh`,
          {
            headers: {
              'User-Agent': 'StoreMapApp (Jarviszxw1024@gmail.com)',
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }
  
        const data = await response.json();
        console.log('Nominatim response:', data);
  
        if (data.length === 0) {
          return null;
        }
  
        const result = data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        
        // Extract city name properly - prioritize city over district
        let cityName = null;
        // First look for city
        if (result.address.city) {
          cityName = result.address.city;
        } 
        // If no city, check for town
        else if (result.address.town) {
          cityName = result.address.town;
        }
        // If no town, check for village 
        else if (result.address.village) {
          cityName = result.address.village;
        }
        // If no village, check for county
        else if (result.address.county) {
          cityName = result.address.county;
        }
        
        // Extract country
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
      };
  
      // 将地址按逗号分隔
      const addressParts = address.split(',').map(part => part.trim());
  
      // 先尝试完整地址
      let result = await attemptGeocode(address);
      if (result) return result;
  
      // 如果地址部分超过两个（国家+城市+详细地址），逐步减少详细地址部分
      if (addressParts.length > 2) {
        // 去掉最后一部分（例如去掉门牌号）
        let reducedAddress = addressParts.slice(0, -1).join(', ');
        result = await attemptGeocode(reducedAddress);
        if (result) return result;
  
        // 如果还有更多部分，继续减少（例如去掉街道）
        if (addressParts.length > 3) {
          reducedAddress = addressParts.slice(0, -2).join(', ');
          result = await attemptGeocode(reducedAddress);
          if (result) return result;
        }
      }
  
      // 最后回退到国家+城市
      const fallbackAddress = addressParts.slice(0, 2).join(', ');
      result = await attemptGeocode(fallbackAddress);
      if (result) return result;
  
      throw new Error("No results found for the address after all attempts. Ensure the address is detailed and correctly formatted.");
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
      // Validate file type to avoid unsupported MIME type errors
      const validFileTypes = [
        'application/pdf', // PDF
        'application/msword', // DOC
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/x-iwork-pages-sffpages', // Pages
        'application/vnd.apple.pages', // Alternative MIME type for Pages
      ];
      
      // Use file extension for validation instead of strict MIME type checking
      const fileExt = file.name.split(".").pop()?.toLowerCase() || '';
      
      // Validate file extension matches allowed types
      if (!['pdf', 'doc', 'docx', 'pages'].includes(fileExt)) {
        throw new Error(`File extension ".${fileExt}" is not supported. Please use PDF, DOC, DOCX, or Pages files.`);
      }
      
      const bucketName = "csentio-contracts";
      const bucketExists = await ensureBucketExists(bucketName);

      if (!bucketExists) {
        throw new Error("Failed to ensure bucket exists");
      }

      const originalName = file.name; // Store original name
      const fileName = `${Date.now()}-${storeId}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      console.log(`Uploading file: ${filePath}, type: ${file.type}, size: ${Math.round(file.size/1024)}KB`);

      // For Pages files, use a generic content type if needed
      const contentType = 
        fileExt === 'pages' && !validFileTypes.includes(file.type) 
          ? 'application/octet-stream' 
          : file.type;

      const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
        contentType: contentType,
        upsert: true,
        duplex: 'half',
        metadata: {
          originalName: originalName
        }
      });

      if (error) {
        console.error('Error uploading file:', error);
        
        if (error.message.includes('mime type') || error.message.includes('not supported')) {
          // For MIME type errors with .pages files
          if (fileExt === 'pages') {
            throw new Error(`Pages files are not supported by default. Please configure your Supabase bucket to allow all file types.`);
          } else {
            throw new Error(`File type not supported. Please use PDF, DOC, DOCX, or Pages files only.`);
          }
        }
        
        throw error;
      }

      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      
      // Add original filename as a query parameter
      const url = new URL(urlData.publicUrl);
      url.searchParams.append('originalName', encodeURIComponent(originalName));
      
      return url.toString();
    } catch (error) {
      console.error("Error uploading contract file:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
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
      let cityAdded = false;

      if (fullAddress.trim()) {
        const geocodedData = await geocodeAddress(fullAddress);
        if (geocodedData) {
          latitude = geocodedData.latitude;
          longitude = geocodedData.longitude;
          
          // Use the manually entered city name instead of geocoded city
          const manualCityName = newStoreAddressFields.city.trim();
          
          // Find matching city in database - use exact match only
          const matchedCity = cities.find(city => 
            city.city_name.toLowerCase() === manualCityName.toLowerCase()
          );

          if (matchedCity) {
            cityId = matchedCity.id;
          } else {
            // Create new city with manual city name
            const { data: newCityData, error: cityError } = await supabase
              .from('cities')
              .insert({
                city_name: manualCityName,
                country: newStoreAddressFields.country.trim() || geocodedData.country || 'Unknown',
              })
              .select();

            if (cityError) throw cityError;

            if (newCityData && newCityData[0]) {
              // Update local cities state for immediate UI update
              setCities(prevCities => [...prevCities, newCityData[0]]);
              cityId = newCityData[0].id;
              cityAdded = true;
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
        setRefreshTrigger(prev => prev + 1); // Trigger refresh after successful addition
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
      <div className="flex justify-between items-baseline mb-2">
        <Label htmlFor="contractFile">Contract File</Label>
        <span className="text-xs text-muted-foreground mb-1 mr-8">(Supported formats: PDF, DOC, DOCX, Pages)</span>
      </div>
      
                    
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
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleAddStore}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        <TabsContent value="map">
          <StoreMapWrapper className="h-[calc(100vh-235px)]" refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="list" className="m-0">
          <StoreList refreshTrigger={refreshTrigger} />
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