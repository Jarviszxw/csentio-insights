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
}

export function StoreList({ className }: StoreListProps) {
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

  // Structured address fields (local state for UI only)
  const [addressFields, setAddressFields] = useState({
    country: '',
    city: '',
    detailedAddress: '',
    postalCode: '',
  });

  // Get city list
  useEffect(() => {
    async function fetchCities() {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .order('city_name');

        if (error) throw error;

        if (data) {
          setCities(data);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    }

    fetchCities();
  }, []);

  // Get store list
  useEffect(() => {
    async function fetchStores() {
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

        if (error) throw error;

        if (data) {
          setStores(data);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStores();
  }, []);

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
            'User-Agent': 'StoreMapApp (your-email@example.com)',
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
  const geocodeAndUpdateStore = async (store: StoreData) => {
    if (!store) return store;

    const { detailedAddress, city, country, postalCode } = addressFields;
    const addressParts = [];
    if (detailedAddress) addressParts.push(detailedAddress);
    if (city) addressParts.push(city);
    if (country) addressParts.push(country);
    if (postalCode) addressParts.push(postalCode);
    const fullAddress = addressParts.join(', ');

    let updatedStore = { ...store, address: fullAddress };

    if (!fullAddress.trim()) {
      return {
        ...updatedStore,
        address: '',
        latitude: null,
        longitude: null,
        city_id: null,
      };
    }

    const geocodedData = await geocodeAddress(fullAddress);

    if (!geocodedData) {
      throw new Error("Unable to geocode address. Please check the address and try again.");
    }

    const { latitude, longitude, cityName, country: geocodedCountry } = geocodedData;

    let cityId: number | null = null;
    if (cityName) {
      const matchedCity = cities.find(city =>
        city.city_name.toLowerCase() === cityName.toLowerCase()
      );

      if (matchedCity) {
        cityId = matchedCity.id;
      } else {
        try {
          const { data: newCityData, error: cityError } = await supabase
            .from('cities')
            .insert({
              city_name: cityName,
              country: geocodedCountry || country || 'Unknown',
            })
            .select();

          if (cityError) throw cityError;

          if (newCityData && newCityData.length > 0) {
            setCities([...cities, newCityData[0]]);
            cityId = newCityData[0].id;
          }
        } catch (error) {
          console.error(`Error creating new city "${cityName}":`, error);
          throw new Error(`Failed to create new city: ${cityName}`);
        }
      }
    }

    return {
      ...updatedStore,
      latitude,
      longitude,
      city_id: cityId,
    };
  };

  // Initialize address fields when opening the edit dialog
  const handleEditStore = (store: StoreData) => {
    setContractFile(null);
    setContractFileToRemove(false);
    setSelectedStore(store);

    const addressParts = store.address ? store.address.split(', ').map(part => part.trim()) : [];
    setAddressFields({
      country: addressParts.length > 2 ? addressParts[addressParts.length - 1] : '',
      city: addressParts.length > 1 ? addressParts[addressParts.length - 2] : '',
      detailedAddress: addressParts.length > 0 ? addressParts[0] : '',
      postalCode: addressParts.length > 3 ? addressParts[addressParts.length - 3] : '',
    });

    setIsEditMode(true);
  };

  // Contract file processing function
  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setContractFile(e.target.files[0]);
      setContractFileToRemove(false);
    }
  };

  // Handle file removal
  const handleRemoveContractFile = () => {
    setContractFile(null);
    setContractFileToRemove(true);
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

  // Ensure the Supabase bucket exists
  const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        console.error('Error listing buckets:', listError);
        throw listError;
      }
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });

        if (error) {
          console.error('Error creating bucket:', error);
          throw new Error(`Failed to create bucket: ${error.message}`);
        }
      }

      return true;
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to ensure bucket exists');
      return false;
    }
  };

  // Upload contract file to Supabase storage
  const uploadContractFile = async (file: File, storeId: number): Promise<string | null> => {
    try {
      const bucketName = 'csentio-contracts';
      const bucketExists = await ensureBucketExists(bucketName);

      if (!bucketExists) {
        throw new Error('Failed to ensure bucket exists');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const sanitizedBaseName = sanitizeFileName(baseName);
      const fileName = `${Date.now()}-${storeId}-${sanitizedBaseName}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      console.log('Uploading file:', { fileName, fileSize: file.size, fileType: file.type });

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.apple.pages',
        'application/zip',
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, PAGES');
      }

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('Failed to generate public URL for the file');
      }

      console.log('File uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading contract file:', error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
      return null;
    }
  };

  // Delete file from Supabase storage
  const deleteContractFile = async (fileUrl: string): Promise<boolean> => {
    try {
      const bucketName = 'csentio-contracts';
      const url = new URL(fileUrl);
      const pathSegments = url.pathname.split('/').filter(segment => segment);
      const bucketIndex = pathSegments.indexOf(bucketName);
      if (bucketIndex === -1 || bucketIndex === pathSegments.length - 1) {
        console.error('Invalid contract file URL:', fileUrl);
        return false;
      }
      const filePath = pathSegments.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting contract file:', error);
      toast.error("Failed to delete file");
      return false;
    }
  };

  // Save store information
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

    if (!addressFields.country?.trim() || !addressFields.city?.trim()) {
      setValidationError("Country and city are required");
      toast.error("Country and city are required");
      return;
    }

    setValidationError(null);
    setIsLoading(true);

    try {
      if (selectedStore) {
        let updatedStore = await geocodeAndUpdateStore(selectedStore);

        if (contractFileToRemove && updatedStore.contract_file_url) {
          const deleted = await deleteContractFile(updatedStore.contract_file_url);
          if (deleted) {
            updatedStore.contract_file_url = undefined;
          }
        }

        if (contractFile) {
          if (updatedStore.contract_file_url) {
            await deleteContractFile(updatedStore.contract_file_url);
          }

          const fileUrl = await uploadContractFile(contractFile, updatedStore.store_id);
          if (fileUrl) {
            updatedStore.contract_file_url = fileUrl;
          }
        }

        const { error } = await supabase
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
            contract_file_url: updatedStore.contract_file_url,
            updated_at: new Date().toISOString(),
          })
          .eq('store_id', updatedStore.store_id);

        if (error) throw error;

        setStores(stores.map(store =>
          store.store_id === updatedStore.store_id ? updatedStore : store
        ));

        setIsEditMode(false);
        toast.success("Store updated successfully");
      }

      setContractFile(null);
      setContractFileToRemove(false);

    } catch (error) {
      console.error('Error saving store:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save store");
    } finally {
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

  // Add filteredStores definition
  const filteredStores = React.useMemo(() => {
    const filtered = stores.filter(store => {
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

    return filtered.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [stores, statusFilter, cityFilter]);

  // Add processing functions
  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedStore) {
      setSelectedStore({ ...selectedStore, store_name: e.target.value });
    }
  };

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedStore) {
      setSelectedStore({ ...selectedStore, contact_info: e.target.value });
    }
  };

  const handleContractInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedStore) {
      setSelectedStore({ ...selectedStore, contract_info: e.target.value });
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressFields({ ...addressFields, country: e.target.value });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressFields({ ...addressFields, city: e.target.value });
  };

  const handleDetailedAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressFields({ ...addressFields, detailedAddress: e.target.value });
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressFields({ ...addressFields, postalCode: e.target.value });
  };

// Render file information
const renderFileInfo = (fileUrl?: string) => {
  if (contractFile) {
    return (
      <Badge variant="outline" className="flex gap-1 items-center">
        <FileText className="h-3 w-3" />
        {contractFile.name}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 ml-1 hover:bg-muted rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveContractFile();
          }}
        >
        </Button>
      </Badge>
    );
  } else if (fileUrl) {
    return (
      <Badge variant="outline" className="flex gap-1 items-center">
        <FileText className="h-3 w-3" />
        {fileUrl.split('/').pop()}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 ml-1 hover:bg-muted rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveContractFile();
          }}
        >
        </Button>
      </Badge>
    );
  } else {
    return <p className="text-sm text-muted-foreground">Click to choose file</p>;
  }
};

// Contract file component for edit
const ContractFileComponent = ({ fileUrl }: { fileUrl?: string }) => (
  <div className="space-y-2">
    <Label htmlFor="contractFile">Contract File</Label>
    <div className="border rounded-md p-2 relative">
      <div className="flex flex-wrap gap-2">
        {renderFileInfo(fileUrl)} {/* Always render the custom UI */}
      </div>
      <Input
        id="contractFile"
        type="file"
        accept=".pdf,.doc,.docx,.txt,.pages"
        onChange={handleContractFileChange}
        className="absolute inset-0 opacity-0 cursor-pointer file:hidden" 
      />
    </div>
  </div>
);

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-4">
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
              {filteredStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No stores found matching the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
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
                        <span className="text-sm">{store.contact_info}</span>
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
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleViewDetails(store)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
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

      {/* Edit Store Dialog with Scrollable Content */}
      <Dialog
        open={isEditMode}
        onOpenChange={(open) => {
          setIsEditMode(open);
          if (!open) {
            setValidationError(null);
            setAddressFields({
              country: "",
              city: "",
              detailedAddress: "",
              postalCode: "",
            });
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
          {/* 将 ScrollArea 包裹具体滚动区域 */}
          {/* Add a dummy focusable element with tabIndex={0} and a ref */}
          <div
            ref={(node) => {
              if (node && isEditMode) {
                node.focus(); // Focus this element when the dialog opens
              }
            }}
            tabIndex={0}
            className="absolute w-0 h-0 overflow-hidden outline-none"
            aria-hidden="true"
          />
          <ScrollArea className="max-h-[60vh] w-full">
            <div className="py-4 space-y-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="editStoreName">Store Name</Label>
                <Input
                  id="editStoreName"
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
                <Label>Address</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label
                        htmlFor="editCountry"
                        className="text-sm font-normal mb-1 text-muted-foreground"
                      >
                        Country
                      </Label>
                      <Input
                        id="editCountry"
                        placeholder="e.g., China"
                        value={addressFields.country}
                        onChange={handleCountryChange}
                      />
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor="editCity"
                        className="text-sm font-normal mb-1 text-muted-foreground"
                      >
                        City
                      </Label>
                      <Input
                        id="editCity"
                        placeholder="e.g., Shanghai"
                        value={addressFields.city}
                        onChange={handleCityChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor="editDetailedAddress"
                      className="text-sm font-normal mb-1 text-muted-foreground"
                    >
                      Detailed Address
                    </Label>
                    <Input
                      id="editDetailedAddress"
                      placeholder="e.g., 123 Nanjing East Road, Huangpu District"
                      value={addressFields.detailedAddress}
                      onChange={handleDetailedAddressChange}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="editPostalCode"
                      className="text-sm font-normal mb-1 text-muted-foreground"
                    >
                      Postal Code (Optional)
                    </Label>
                    <Input
                      id="editPostalCode"
                      placeholder="Enter postal code"
                      value={addressFields.postalCode}
                      onChange={handlePostalCodeChange}
                    />
                  </div>
                </div>
                {validationError === "Address is required" && (
                  <p className="text-sm text-destructive">Address is required</p>
                )}
                {validationError === "Country and city are required" && (
                  <p className="text-sm text-destructive">
                    Country and city are required
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editContactInfo">Contact Information</Label>
                <Input
                  id="editContactInfo"
                  placeholder="Enter contact information"
                  value={selectedStore?.contact_info || ""}
                  onChange={handleContactInfoChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editContractInfo">Contract Information</Label>
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
                    onCheckedChange={(checked) => {
                      if (selectedStore) {
                        setSelectedStore({
                          ...selectedStore,
                          is_active: checked,
                        });
                      }
                    }}
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
                setAddressFields({
                  country: "",
                  city: "",
                  detailedAddress: "",
                  postalCode: "",
                });
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

      {/* Store Details Dialog */}
      <StoreDetailsDialog
        store={storeToView}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
}