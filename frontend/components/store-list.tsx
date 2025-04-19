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
  DialogTrigger,
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

  // Address processing function - extract city and set coordinates from address
  const handleAddressChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const address = e.target.value;
    
    if (selectedStore) {
      setSelectedStore({ ...selectedStore, address });
    }
    
    // Extract city name from address
    const cityMatch = address.match(/([^,]+), China/);
    if (cityMatch && cityMatch[1]) {
      const cityName = cityMatch[1].trim();
      
      // Find matching city
      const matchedCity = cities.find(city => 
        city.city_name.toLowerCase() === cityName.toLowerCase()
      );
      
      if (matchedCity) {
        // If city found, use its ID
        const coordinates = getCityCoordinates(cityName);
        
        if (selectedStore) {
          setSelectedStore({
            ...selectedStore,
            city_id: matchedCity.id,
            latitude: coordinates.lat,
            longitude: coordinates.lng
          });
        }
      } else {
        // If no matching city found, create new city
        try {
          const coordinates = getCityCoordinates(cityName);
          
          // First add the city to database
          const { data: newCityData, error: cityError } = await supabase
            .from('cities')
            .insert({
              city_name: cityName,
              country: 'China'
            })
            .select();
          
          if (cityError) throw cityError;
          
          if (newCityData && newCityData.length > 0) {
            // Add to local cities state
            setCities([...cities, newCityData[0]]);
            
            // Update store data with new city
            if (selectedStore) {
              setSelectedStore({
                ...selectedStore,
                city_id: newCityData[0].id,
                latitude: coordinates.lat,
                longitude: coordinates.lng
              });
            }
          }
        } catch (error) {
          console.error(`Error creating new city "${cityName}":`, error);
        }
      }
    }
  };
  
  // Simple city coordinate mapping (in real app, use geocode API)
  const getCityCoordinates = (cityName: string) => {
    const coordinates: {[key: string]: {lat: number, lng: number}} = {
      'Shanghai': {lat: 31.2304, lng: 121.4737},
      'Beijing': {lat: 39.9042, lng: 116.4074},
      'Guangzhou': {lat: 23.1291, lng: 113.2644},
      'Shenzhen': {lat: 22.5431, lng: 114.0579},
      'Chengdu': {lat: 30.5728, lng: 104.0668},
      'Hangzhou': {lat: 30.2741, lng: 120.1551}
    };
    
    // Case insensitive lookup
    const normalizedCityName = cityName.toLowerCase();
    for (const [key, value] of Object.entries(coordinates)) {
      if (key.toLowerCase() === normalizedCityName) {
        return value;
      }
    }
    
    // If not found, use default China center or calculate approximate coordinates
    return {lat: 35.8617, lng: 104.1954}; 
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
  
  // Ensure the Supabase bucket exists
  const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        // Create the bucket if it doesn't exist
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (error) {
          console.error('Error creating bucket:', error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      return false;
    }
  };

  // Upload contract file to Supabase storage
  const uploadContractFile = async (file: File, storeId: number): Promise<string | null> => {
    try {
      // Ensure bucket exists
      const bucketName = 'store_contracts';
      const bucketExists = await ensureBucketExists(bucketName);
      
      if (!bucketExists) {
        throw new Error('Failed to ensure bucket exists');
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${storeId}.${fileExt}`;
      const filePath = `contracts/${fileName}`;
      
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading contract file:', error);
      toast.error("Failed to upload file");
      return null;
    }
  };

  // Delete file from Supabase storage
  const deleteContractFile = async (fileUrl: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const bucketName = 'store_contracts';
      const urlParts = fileUrl.split(`${bucketName}/`);
      if (urlParts.length < 2) return false;
      
      const filePath = urlParts[1];
      
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
    // Validate required fields
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
    
    // Clear validation error if we passed validation
    setValidationError(null);
    setIsLoading(true);
    
    try {
      if (selectedStore) {
        // Update existing store
        let updatedStore = {...selectedStore};
        
        // Handle contract file deletion if marked for removal
        if (contractFileToRemove && updatedStore.contract_file_url) {
          const deleted = await deleteContractFile(updatedStore.contract_file_url);
          if (deleted) {
            updatedStore.contract_file_url = undefined;
          }
        }
        
        // If there's a new contract file to upload
        if (contractFile) {
          // Delete old file if exists
          if (updatedStore.contract_file_url) {
            await deleteContractFile(updatedStore.contract_file_url);
          }
          
          // Upload new file
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
            updated_at: new Date().toISOString()
          })
          .eq('store_id', updatedStore.store_id);
          
        if (error) throw error;
        
        // Update local state
        setStores(stores.map(store => 
          store.store_id === updatedStore.store_id ? updatedStore : store
        ));
        
        // Close the dialog
        setIsEditMode(false);
        toast.success("Store updated successfully");
      }
      
      // Clear temporary state
      setContractFile(null);
      setContractFileToRemove(false);
      
    } catch (error) {
      console.error('Error saving store:', error);
      toast.error("Failed to save store");
    } finally {
      setIsLoading(false);
    }
  };

  // Open Edit Store Dialog
  const handleEditStore = (store: StoreData) => {
    setContractFile(null);
    setContractFileToRemove(false);
    setSelectedStore(store);
    setIsEditMode(true);
  };

  // View Store Details
  const handleViewDetails = (store: StoreData) => {
    setStoreToView(store);
    setIsDetailsDialogOpen(true);
  };

  // Format date for display (YYYY-MM-DD)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd");
  };

  // Add filteredStores definition
  const filteredStores = React.useMemo(() => {
    const filtered = stores.filter(store => {
      // Filter by status
      if (statusFilter !== "all") {
        const isActive = statusFilter === "active";
        if (store.is_active !== isActive) return false;
      }
      
      // Filter by city
      if (cityFilter !== "all") {
        const cityMatch = store.address.includes(cityFilter);
        if (!cityMatch) return false;
      }
      
      return true;
    });
    
    // Sort by creation date (latest first)
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
            <XCircle className="h-3 w-3" />
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
            <XCircle className="h-3 w-3" />
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
          {contractFile || fileUrl ? (
            renderFileInfo(fileUrl)
          ) : (
            <p className="text-sm text-muted-foreground">Click to choose file</p>
          )}
        </div>
        <Input 
          id="contractFile" 
          type="file" 
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleContractFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
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
                        <Dialog open={isEditMode} onOpenChange={(open) => {
                          setIsEditMode(open);
                          if (!open) setValidationError(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => handleEditStore(store)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-background">
                            <DialogHeader>
                              <DialogTitle>Edit Store</DialogTitle>
                              <DialogDescription>
                                Update the details of the existing store.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="editStoreName">Store Name</Label>
                                <Input 
                                  id="editStoreName" 
                                  placeholder="Enter store name" 
                                  value={selectedStore?.store_name || ""}
                                  onChange={handleStoreNameChange}
                                  className={validationError === "Store name is required" ? "border-destructive" : ""}
                                />
                                {validationError === "Store name is required" && (
                                  <p className="text-sm text-destructive">Store name is required</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editAddress">Address</Label>
                                <Textarea 
                                  id="editAddress" 
                                  placeholder="Enter store address" 
                                  value={selectedStore?.address || ""}
                                  onChange={handleAddressChange}
                                  className={validationError === "Address is required" ? "border-destructive" : ""}
                                />
                                {validationError === "Address is required" && (
                                  <p className="text-sm text-destructive">Address is required</p>
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
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {
                                setIsEditMode(false);
                                setValidationError(null);
                              }}>Cancel</Button>
                              <Button onClick={handleSaveStore} disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="icon" onClick={() => handleViewDetails(store)}>
                          <Eye className="h-4 w-4" />
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

      {/* Store Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-md bg-background">
          <DialogHeader>
            <DialogTitle>{storeToView?.store_name}</DialogTitle>
            <DialogDescription>
              Store Details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Contact Information</h4>
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{storeToView?.contact_info || "No contact information available"}</p>
              </div>
            </div>
            {storeToView?.contract_file_url && (
              <div>
                <h4 className="text-sm font-medium mb-1">Contract File</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={storeToView.contract_file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {storeToView.contract_file_url.split('/').pop()}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}