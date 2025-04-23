"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Filter,
  FileText,
  Eye
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import supabase from "@/lib/supabase";
import { toast } from "sonner";
import { StoreDetailsDialog } from "./store-details-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

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

interface StoreListProps {
  className?: string;
  onStoreUpdated?: () => void;
  refreshTrigger?: number;
}

export function StoreList({ className, onStoreUpdated, refreshTrigger = 0 }: StoreListProps) {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [storeToView, setStoreToView] = useState<StoreData | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  // Add new states
  const [cities, setCities] = useState<CityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractFileToRemove, setContractFileToRemove] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get city list whenever refreshTrigger changes
  React.useEffect(() => {
    async function fetchCities() {
      console.log('[fetchCities] Fetching city data...');
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .order('city_name');

        if (error) throw error;

        if (data) {
          console.log('[fetchCities] City data received, count:', data.length);
          setCities(data);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    }

    fetchCities();
  }, [refreshTrigger]);

  // Get store list
  useEffect(() => {
    async function fetchStores() {
      console.log('[fetchStores] Starting fetch...');
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('stores')
          .select(`
            store_id,
            store_name,
            address,
            contact_info,
            is_active,
            latitude,
            longitude,
            city_id,
            created_at,
            updated_at,
            contract_info,
            contract_file_url
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("fetchStores: Supabase error:", error);
          throw error;
        }

        if (data) {
          console.log('[fetchStores] Data received, count:', data.length);
          setStores(data);
        } else {
          console.log('[fetchStores] No data received.');
          // Don't set empty stores here to prevent flickering
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        // Don't update stores on error to maintain current list
      } finally {
        console.log('[fetchStores] Fetch finished, setting isLoading to false.');
        setIsLoading(false);
      }
    }

    fetchStores();
  }, [refreshTrigger]);

  // Geocoding function using Nominatim API
  const geocodeAddress = async (address: string): Promise<{
    latitude: number;
    longitude: number;
    cityName: string | null;
    country: string | null;
  } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`,
        {
          headers: {
            'User-Agent': 'StoreMapApp (Jarviszxw1024@gmail.com)',
          },
        }
      );
      const data = await response.json();

      if (data.length === 0) {
        throw new Error("No results found for the address");
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
      return null;
    }
  };

  // Geocode and update store during save
  const geocodeAndUpdateStore = async (store: StoreData): Promise<StoreData> => {
    if (!store || !store.address?.trim()) {
      return {
        ...store,
        address: store?.address || '', // Preserve original or empty
        latitude: null,
        longitude: null,
        city_id: null,
      };
    }

    const fullAddress = store.address.trim();
    let updatedStore = { ...store, address: fullAddress }; // Start with the provided address

    try {
      const geocodedData = await geocodeAddress(fullAddress);

      if (!geocodedData) {
        console.warn("Geocoding failed for address:", fullAddress);
        // Return store with original address but nullified coords/city if geocoding fails
        return {
          ...updatedStore,
          latitude: null,
          longitude: null,
          city_id: null,
        };
      }

      const { latitude, longitude, cityName, country: geocodedCountry } = geocodedData;
      let cityId: number | null = null;

      // Extract city name from full address
      const addressParts = fullAddress.split(',').map(part => part.trim());
      // Use second or third part of the address as city if it exists
      // Typically address format: "street, district, city, country"
      const possibleCityName = addressParts.length > 2 ? addressParts[addressParts.length - 2] : 
                              (addressParts.length > 1 ? addressParts[addressParts.length - 1] : null);

      if (cityName || possibleCityName) {
        // Prioritize cityName from geocoder, fallback to extracted city from address
        const finalCityName = cityName || possibleCityName || '';
        
        // Try to find an EXACT match in the existing cities list
        const matchedCity = cities.find(city =>
          city.city_name.toLowerCase() === finalCityName.toLowerCase()
        );

        if (matchedCity) {
          // Only set cityId if an exact match is found in our DB cities
          cityId = matchedCity.id;
          console.log(`[geocodeAndUpdateStore] Matched existing city: ${matchedCity.city_name} (ID: ${cityId})`);
        } else {
          // If no exact match, DO NOT create a new city. Log the discrepancy.
          console.warn(`[geocodeAndUpdateStore] Geocoded city "${finalCityName}" not found in existing cities list. Not creating new city.`);
          // Keep cityId as null. Add back original city_id if needed: cityId = store.city_id;
        }
      } else {
        console.log('[geocodeAndUpdateStore] No city name returned by geocoder.');
      }

      // Return updated store with geocoded coords but potentially null cityId
      return {
        ...updatedStore,
        latitude,
        longitude,
        city_id: cityId, // Use the found ID or null
      };

    } catch (error) {
        console.error('Error during geocoding or city handling:', error);
        toast.error(error instanceof Error ? error.message : "Geocoding failed");
        // Return store with original address but nullified coords/city on error
        return {
          ...updatedStore,
          latitude: null,
          longitude: null,
          city_id: null,
        };
    }
  };

  // Modify handleEditStore
  const handleEditStore = (store: StoreData) => {
    setContractFile(null);
    setContractFileToRemove(false);
    // Create a fresh copy of the store to prevent reference issues
    setSelectedStore(JSON.parse(JSON.stringify(store)));
    setValidationError(null); // Clear previous errors
    setIsEditMode(true);
  };

  // Change to normal functions without useCallback to simplify
  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (selectedStore) {
      const newStore = { ...selectedStore, store_name: value };
      setSelectedStore(newStore);
    }
  };

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (selectedStore) {
      const newStore = { ...selectedStore, contact_info: value };
      setSelectedStore(newStore);
    }
  };

  const handleContractInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (selectedStore) {
      const newStore = { ...selectedStore, contract_info: value };
      setSelectedStore(newStore);
    }
  };

  const handleAddressTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (selectedStore) {
      const newStore = { ...selectedStore, address: value };
      setSelectedStore(newStore);
    }
  };

  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setContractFile(e.target.files[0]);
      setContractFileToRemove(false);
    }
  };

  const handleRemoveContractFile = () => {
    setContractFile(null);
    setContractFileToRemove(true);
  };

  // Handle active status change
  const handleActiveStatusChange = (checked: boolean) => {
    if (selectedStore) {
      const newStore = { ...selectedStore, is_active: checked };
      setSelectedStore(newStore);
    }
  };

  // Sanitize file name for Supabase Storage
  const sanitizeFileName = (fileName: string): string => {
    const normalized = fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x00-\x7F]/g, '_');

    const sanitized = normalized
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');

    return sanitized.replace(/^_+|_+$/g, '');
  };

  // Add back uploadFileToBackend function definition
  const uploadFileToBackend = async (file: File, storeId: number): Promise<string | null> => {
    try {
      // Validate file type to avoid unsupported MIME type errors
      const validFileTypes = [
        'application/pdf', // PDF
        'application/msword', // DOC
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/x-iwork-pages-sffpages', // Pages
        'application/vnd.apple.pages', // Alternative MIME type for Pages
      ];
      
      // Rather than strict MIME type validation, use file extension for validation
      // as .pages files may have various MIME types depending on the system
      const fileExt = file.name.split(".").pop()?.toLowerCase() || '';
      
      // Validate file extension matches allowed types
      if (!['pdf', 'doc', 'docx', 'pages'].includes(fileExt)) {
        throw new Error(`File extension ".${fileExt}" is not supported. Please use PDF, DOC, DOCX, or Pages files.`);
      }
      
      // Use a predefined bucket name - this bucket should already exist in Supabase
      const bucketName = "csentio-contracts";
      
      const sanitizedName = sanitizeFileName(file.name.split('.')[0]);
      const originalName = file.name; // Store original name for display
      const fileName = `contracts/${Date.now()}-${storeId}-${sanitizedName}.${fileExt}`;
      
      console.log(`Uploading file: ${fileName}, type: ${file.type}, size: ${Math.round(file.size/1024)}KB`);
      
      // For Pages files, default to a generic content type if needed
      const contentType = 
        fileExt === 'pages' && !validFileTypes.includes(file.type) 
          ? 'application/octet-stream' 
          : file.type;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true, // Use upsert in case file exists
          contentType: contentType, // Use the determined content type
          duplex: 'half',
          metadata: {
            originalName: originalName, // Store original filename as metadata
          }
        });
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        
        // Special handling for common errors
        if (uploadError.message.includes('bucket') || uploadError.message.includes('violates row-level security policy')) {
          throw new Error(`Permission denied. Please ensure the bucket "${bucketName}" exists and has proper permissions.`);
        }
        
        if (uploadError.message.includes('mime type') || uploadError.message.includes('not supported')) {
          // For MIME type errors with .pages files, suggest setting bucket to allow all file types
          if (fileExt === 'pages') {
            throw new Error(`Pages files are not supported by default. Please configure your Supabase bucket to allow all file types.`);
          } else {
            throw new Error(`File type not supported. Please use PDF, DOC, DOCX, or Pages files only.`);
          }
        }
        
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      // Get the public URL
      const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      
      if (!data?.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      
      // Add original filename as a query parameter
      const url = new URL(data.publicUrl);
      url.searchParams.append('originalName', encodeURIComponent(originalName));
      
      return url.toString();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'File upload failed');
      return null;
    }
  };

  // Add filteredStores definition
  const filteredStores = React.useMemo(() => {
    console.log('[filteredStores] Calculating - isLoading:', isLoading, 'stores count:', stores.length, 'statusFilter:', statusFilter, 'cityFilter:', cityFilter);
    
    // Always return current stores while loading to prevent emptying the list
    const storeList = stores;
    
    if (storeList.length === 0) return [];
    
    const filtered = storeList.filter(store => {
      if (statusFilter !== "all") {
        const isActive = statusFilter === "active";
        if (store.is_active !== isActive) return false;
      }

      if (cityFilter !== "all") {
        const cityMatch = store.address && store.address.includes(cityFilter);
        if (!cityMatch) return false;
      }

      return true;
    });
    console.log('[filteredStores] Calculation done, filtered count:', filtered.length);
    return filtered.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [stores, statusFilter, cityFilter, isLoading]);
  
  // Modify handleSaveStore to avoid list emptying while saving
  const handleSaveStore = async () => {
    if (!selectedStore?.store_name?.trim()) {
      setValidationError("Store name is required");
      toast.error("Store name is required");
      return;
    }

    if (!selectedStore?.address?.trim()) {
      setValidationError("Address is required");
      toast.error("Address is required");
      return;
    }

    setValidationError(null);
    
    // Show loading state for the save button
    setIsLoading(true);

    try { // Outer try for the whole process
      if (selectedStore) {
        let updatedStore = await geocodeAndUpdateStore(selectedStore);
        let finalFileUrl: string | null | undefined = updatedStore.contract_file_url;

        // --- Handle File Deletion Request (Flag only) ---
        if (contractFileToRemove && updatedStore.contract_file_url) {
          finalFileUrl = undefined; // Mark for removal
        }

        // --- Handle File Upload via Backend ---
        if (contractFile) {
          const uploadedUrl = await uploadFileToBackend(contractFile, updatedStore.store_id);
          if (uploadedUrl) {
            finalFileUrl = uploadedUrl;
          } else {
            // Upload failed - error already shown by uploadFileToBackend.
            // Important: Stop execution BUT ensure loading state is reset.
            throw new Error("File upload failed via backend."); // Throw to be caught by outer catch
          }
        }

        // --- Update Store Record ---
        console.log(`[handleSaveStore] Updating DB. Final URL: ${finalFileUrl === undefined ? 'undefined (removing)' : finalFileUrl ?? 'null'}`);
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            store_name: updatedStore.store_name,
            address: updatedStore.address,
            contact_info: updatedStore.contact_info,
            is_active: updatedStore.is_active,
            latitude: updatedStore.latitude,
            longitude: updatedStore.longitude,
            city_id: updatedStore.city_id,
            contract_info: updatedStore.contract_info,
            contract_file_url: finalFileUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('store_id', updatedStore.store_id);

        if (updateError) {
          console.error('Error updating store record:', updateError);
          throw updateError; // Throw to be caught by outer catch
        }

        // --- Success --- 
        // Update local state immediately to avoid waiting for refetch
        const finalStoreState: StoreData = {
          ...updatedStore, 
          contract_file_url: finalFileUrl ?? undefined // Coalesce null/undefined to undefined
        };
        
        // Update the store in the current list for immediate UI update
        setStores(prevStores => 
          prevStores.map(store =>
            store.store_id === finalStoreState.store_id ? finalStoreState : store
          )
        );
        
        setIsEditMode(false);
        toast.success("Store updated successfully");
        if (onStoreUpdated) {
          onStoreUpdated();
        }
      }
      setContractFile(null);
      setContractFileToRemove(false);

    } catch (error) {
      // Catch errors from geocoding, backend upload, or DB update
      console.error('Error saving store:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save store");
      // Do not reset contractFile/contractFileToRemove here on error, user might want to retry
    } finally {
      // **Crucially, ensure isLoading is always reset**
      console.log('[handleSaveStore] Resetting loading state in finally block.');
      setIsLoading(false);
    }
  };

  // View Store Details
  const handleViewDetails = (store: StoreData) => {
    setStoreToView(store);
    setIsDetailsDialogOpen(true);
  };

  // Format date for display (e.g., "Apr 21, 2025")
  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return format(date, "MMM d, yyyy");
  };

  // Restore Render file information function
  const renderFileInfo = (fileUrl?: string) => {
    // Existing logic to display badge with filename and remove button
    if (contractFile) {
      return (
        <Badge variant="outline" className="flex gap-1 items-center">
          <FileText className="h-3 w-3" />
          {contractFile.name}
        </Badge>
      );
    } else if (fileUrl) {
      // Extract original filename from URL if available
      try {
        const url = new URL(fileUrl);
        const originalName = url.searchParams.get('originalName');
        
        if (originalName) {
          return (
            <Badge variant="outline" className="flex gap-1 items-center">
              <FileText className="h-3 w-3" />
              {decodeURIComponent(originalName)}
            </Badge>
          );
        }
      } catch (error) {
        // If URL parsing fails, fallback to the old method
        console.warn('Failed to parse file URL', error);
      }
      
      // Fallback to extracting filename from path
      const filename = fileUrl.split('/').pop()?.split('?')[0];
      return (
        <Badge variant="outline" className="flex gap-1 items-center">
          <FileText className="h-3 w-3" />
          {filename || 'File'}
        </Badge>
      );
    } else {
      return <p className="text-sm text-muted-foreground">Click to choose file</p>;
    }
  };

  // Restore Contract file component for edit
  const ContractFileComponent = ({ fileUrl }: { fileUrl?: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline mb-2">
        <Label htmlFor="contractFile">Contract File</Label>
        <span className="text-xs text-muted-foreground mb-1 mr-8">(Supported formats: PDF, DOC, DOCX, Pages)</span>
      </div>
      <div className="border rounded-md relative flex items-center min-h-[40px] p-2 overflow-hidden">
        <div className="flex-grow flex flex-wrap gap-2 mr-2">
          {renderFileInfo(fileUrl)}
        </div>
        <Input
          id="contractFile"
          type="file"
          accept=".pdf,.doc,.docx,.pages"
          onChange={handleContractFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );

  // Log state right before render
  // console.log('[Render] isLoading:', isLoading, 'stores count:', stores.length, 'filteredStores count:', filteredStores.length);

  return (
    <div className="space-y-4">
      {/* Restore Filters Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Label htmlFor="status-filter" className="whitespace-nowrap">Status:</Label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger id="status-filter" className="min-w-[80px] text-center">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="justify-center">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* City Filter */}
              <div className="flex items-center gap-2">
                <Label htmlFor="city-filter" className="whitespace-nowrap">City:</Label>
                <Select
                  value={cityFilter}
                  onValueChange={setCityFilter}
                >
                  <SelectTrigger id="city-filter" className="min-w-[80px] text-center">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent className="justify-center">
                    <SelectItem value="all">All</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city.id} value={city.city_name}>
                        {city.city_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Restore Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Apply loading logic HERE, within the original TableBody structure */}
              {isLoading && stores.length === 0 ? (
                // Display Skeleton rows while loading
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredStores.length === 0 ? (
                // Display No Results row
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No stores found matching the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                // Render actual store rows using original structure
                filteredStores.map((store) => (
                  <TableRow key={store.store_id}>
                    <TableCell className="font-medium">{store.store_name}</TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-sm">{store.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{store.contact_info || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(store.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={store.is_active ? "default" : "secondary"}>
                        {store.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-[2px]">
                        <Button variant="outline" size="icon" className="border-none" onClick={() => handleViewDetails(store)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-none"
                          onClick={() => handleEditStore(store)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Store Dialog (Keep existing structure) */}
      <Dialog
        open={isEditMode}
        onOpenChange={(open) => {
          setIsEditMode(open);
          if (!open) {
            setValidationError(null);
          }
        }}
      >
         <DialogContent className="sm:max-w-md max-h-[80vh] rounded-md border overflow-hidden">
           <DialogHeader>
             <DialogTitle>Edit Store</DialogTitle>
             <DialogDescription>
               Update the details of the existing store.
             </DialogDescription>
           </DialogHeader>
           <ScrollArea className="max-h-[60vh] w-full">
             <div className="py-4 space-y-4 pr-4">
                <div className="space-y-2">
                  <Label htmlFor="editStoreName">Store Name</Label>
                  <Input
                    id="editStoreName"
                    type="text"
                    placeholder="Enter store name"
                    value={selectedStore?.store_name || ""}
                    onChange={handleStoreNameChange}
                    className={
                      validationError === "Store name is required"
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {validationError === "Store name is required" && (
                    <p className="text-sm text-destructive">Store name is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline mb-2">
                    <Label htmlFor="editAddress">Address</Label>
                    <span className="text-xs text-muted-foreground mr-[12px]">(e.g.,Nanjing Road, Huangpu District, Shanghai, China)</span>
                  </div>
                  <Textarea
                    id="editAddress"
                    placeholder="Enter store address..."
                    value={selectedStore?.address || ""}
                    onChange={handleAddressTextAreaChange}
                    rows={3}
                    className={validationError === "Address is required" ? "border-destructive" : ""}
                  />
                  {validationError === "Address is required" && (
                    <p className="text-sm text-destructive">Address is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editContactInfo">Contact Info</Label>
                  <Input
                    id="editContactInfo"
                    type="text"
                    placeholder="Enter contact information"
                    value={selectedStore?.contact_info || ""}
                    onChange={handleContactInfoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editContractInfo">Contract Info</Label>
                  <Textarea
                    id="editContractInfo"
                    placeholder="Enter contract details"
                    value={selectedStore?.contract_info || ""}
                    onChange={handleContractInfoChange}
                  />
                </div>
                <ContractFileComponent fileUrl={selectedStore?.contract_file_url} />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="editActiveStatus"
                      checked={selectedStore?.is_active}
                      onCheckedChange={handleActiveStatusChange}
                    />
                    <Label htmlFor="editActiveStatus" className="text-sm font-normal">
                      {selectedStore?.is_active ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
             </div>
           </ScrollArea>
           <DialogFooter>
             <Button
               variant="outline"
               onClick={() => {
                 setIsEditMode(false);
                 setValidationError(null);
               }}
             >
               Cancel
             </Button>
             <Button onClick={handleSaveStore} disabled={isLoading}>
               {isLoading ? "Saving..." : "Save"}
             </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Store Details Dialog (Ensure correct props) */}
      <StoreDetailsDialog
        store={storeToView}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
}