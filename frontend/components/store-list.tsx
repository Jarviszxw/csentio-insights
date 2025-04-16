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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  Store, 
  MapPin, 
  Phone, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Trash2,
  Edit,
  Plus,
  Filter,
  FileText,
  Eye
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreView } from "./store-context";
import { format } from "date-fns";

// Define the store data structure
interface StoreData {
  store_id: number;
  store_name: string;
  address: string;
  contact_info: string;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  documents?: string[];
  contractInfo?: string;
}

interface StoreListProps {
  className?: string;
}

// Mock data for stores
const mockStores: StoreData[] = [
  {
    store_id: 1,
    store_name: "Store Shanghai",
    address: "123 Nanjing Road, Shanghai, China",
    contact_info: "contact@shanghai.store",
    is_active: true,
    latitude: 31.2304,
    longitude: 121.4737,
    created_at: "2023-01-15T08:30:00Z",
    updated_at: "2023-05-20T14:45:00Z",
    documents: ["Contract_2023.pdf"],
    contractInfo: "5-year partnership agreement signed on January 15, 2023"
  },
  {
    store_id: 2,
    store_name: "Store Beijing",
    address: "456 Wangfujing Street, Beijing, China",
    contact_info: "contact@beijing.store",
    is_active: true,
    latitude: 39.9042,
    longitude: 116.4074,
    created_at: "2023-02-10T10:15:00Z",
    updated_at: "2023-06-05T09:20:00Z",
    documents: ["Beijing_Agreement_2023.docx"],
    contractInfo: "3-year partnership with annual review"
  },
  {
    store_id: 3,
    store_name: "Store Guangzhou",
    address: "789 Beijing Road, Guangzhou, China",
    contact_info: "contact@guangzhou.store",
    is_active: false,
    latitude: 23.1291,
    longitude: 113.2644,
    created_at: "2023-03-22T11:45:00Z",
    updated_at: "2023-04-18T16:30:00Z",
    contractInfo: "Contract pending renewal, discussions ongoing"
  },
  {
    store_id: 4,
    store_name: "Store Shenzhen",
    address: "321 Shennan Road, Shenzhen, China",
    contact_info: "contact@shenzhen.store",
    is_active: true,
    latitude: 22.5431,
    longitude: 114.0579,
    created_at: "2023-04-05T09:00:00Z",
    updated_at: "2023-07-12T13:10:00Z",
    documents: ["Shenzhen_Contract.pdf", "Shenzhen_Amendment.pdf"],
    contractInfo: "Long-term partnership with exclusive distribution rights"
  },
  {
    store_id: 5,
    store_name: "Store Chengdu",
    address: "654 Chunxi Road, Chengdu, China",
    contact_info: "contact@chengdu.store",
    is_active: true,
    latitude: 30.5728,
    longitude: 104.0668,
    created_at: "2023-05-18T14:30:00Z",
    updated_at: "2023-08-03T11:25:00Z",
    documents: ["Chengdu_Agreement.pdf"],
    contractInfo: "2-year initial agreement with extension options"
  },
  {
    store_id: 6,
    store_name: "Store Hangzhou",
    address: "987 West Lake Road, Hangzhou, China",
    contact_info: "contact@hangzhou.store",
    is_active: false,
    latitude: 30.2741,
    longitude: 120.1551,
    created_at: "2023-06-22T09:15:00Z",
    updated_at: "2023-09-08T14:20:00Z",
    contractInfo: "Partnership currently on hold"
  }
];

export function StoreList({ className }: StoreListProps) {
  const { storeId, isAddStoreOpen, setIsAddStoreOpen, setStoreId } = useStoreView();
  const [stores, setStores] = useState<StoreData[]>(mockStores);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [newStore, setNewStore] = useState<Partial<StoreData>>({
    store_name: "",
    address: "",
    contact_info: "",
    is_active: true,
    contractInfo: "",
    documents: []
  });
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [storeToView, setStoreToView] = useState<StoreData | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  
  // Extract unique cities from store addresses
  const cities = React.useMemo(() => {
    const citySet = new Set<string>();
    stores.forEach(store => {
      const cityMatch = store.address.match(/([^,]+), China/);
      if (cityMatch && cityMatch[1]) {
        citySet.add(cityMatch[1].trim());
      }
    });
    return Array.from(citySet);
  }, [stores]);
  
  // Filtered stores based on selected filters
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
    
    // Sort by creation date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [stores, statusFilter, cityFilter]);

  // React to storeId changes from context
  React.useEffect(() => {
    if (storeId !== null) {
      const store = stores.find(s => s.store_id === storeId);
      if (store) {
        setSelectedStore(store);
        setIsEditMode(true);
        setIsOpen(true);
      }
    }
  }, [storeId, stores]);
  
  // React to isAddStoreOpen prop change
  React.useEffect(() => {
    if (isAddStoreOpen) {
      setIsOpen(true);
      setIsEditMode(false);
      setSelectedStore(null);
      setNewStore({
        store_name: "",
        address: "",
        contact_info: "",
        is_active: true,
        contractInfo: "",
        documents: []
      });
      setIsAddStoreOpen(false);
    }
  }, [isAddStoreOpen, setIsAddStoreOpen]);

  // When the Sheet is closed, clear the selected store in context
  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setStoreId(null);
    }
  };

  // Handlers for store form
  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditMode && selectedStore) {
      setSelectedStore({ ...selectedStore, store_name: e.target.value });
    } else {
      setNewStore({ ...newStore, store_name: e.target.value });
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isEditMode && selectedStore) {
      setSelectedStore({ ...selectedStore, address: e.target.value });
    } else {
      setNewStore({ ...newStore, address: e.target.value });
    }
  };

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditMode && selectedStore) {
      setSelectedStore({ ...selectedStore, contact_info: e.target.value });
    } else {
      setNewStore({ ...newStore, contact_info: e.target.value });
    }
  };

  const handleContractInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isEditMode && selectedStore) {
      setSelectedStore({ ...selectedStore, contractInfo: e.target.value });
    } else {
      setNewStore({ ...newStore, contractInfo: e.target.value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileNames = Array.from(e.target.files).map(file => file.name);
      
      if (isEditMode && selectedStore) {
        setSelectedStore({ 
          ...selectedStore, 
          documents: [...(selectedStore.documents || []), ...fileNames] 
        });
      } else {
        setNewStore({ 
          ...newStore, 
          documents: [...(newStore.documents || []), ...fileNames] 
        });
      }
    }
  };

  // Open the form for adding a new store
  const handleAddStore = () => {
    setIsEditMode(false);
    setSelectedStore(null);
    setNewStore({
      store_name: "",
      address: "",
      contact_info: "",
      is_active: true,
      contractInfo: "",
      documents: []
    });
    setIsOpen(true);
  };

  // Open the form for editing an existing store
  const handleEditStore = (store: StoreData) => {
    setIsEditMode(true);
    setSelectedStore(store);
    setIsOpen(true);
  };

  // View store details
  const handleViewDetails = (store: StoreData) => {
    setStoreToView(store);
    setIsDetailsDialogOpen(true);
  };

  // Save a new or edited store
  const handleSaveStore = () => {
    if (isEditMode && selectedStore) {
      // Update existing store
      const updatedStores = stores.map(store => 
        store.store_id === selectedStore.store_id ? selectedStore : store
      );
      setStores(updatedStores);
    } else {
      // Add new store
      const storeData: StoreData = {
        store_id: Math.max(...stores.map(s => s.store_id)) + 1,
        store_name: newStore.store_name || "",
        address: newStore.address || "",
        contact_info: newStore.contact_info || "",
        is_active: newStore.is_active ?? true,
        latitude: null,
        longitude: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        contractInfo: newStore.contractInfo,
        documents: newStore.documents
      };
      setStores([...stores, storeData]);
    }
    
    // Close the form
    setIsOpen(false);
  };

  // Format date for display (YYYY-MM-DD)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd");
  };

  return (
    <div className="space-y-4">
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
                      <SelectItem key={city} value={city}>
                        {city}
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
                <TableHead>Store Name</TableHead>
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => handleEditStore(store)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
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
                                  value={selectedStore?.store_name}
                                  onChange={handleStoreNameChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editAddress">Address</Label>
                                <Textarea 
                                  id="editAddress" 
                                  placeholder="Enter store address" 
                                  value={selectedStore?.address}
                                  onChange={handleAddressChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editContactInfo">Contact Information</Label>
                                <Input 
                                  id="editContactInfo" 
                                  placeholder="Enter contact information" 
                                  value={selectedStore?.contact_info}
                                  onChange={handleContactInfoChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editContractInfo">Contract Information</Label>
                                <Textarea 
                                  id="editContractInfo" 
                                  placeholder="Enter contract information" 
                                  value={selectedStore?.contractInfo}
                                  onChange={handleContractInfoChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editDocuments">Attachments</Label>
                                <div className="border rounded-md p-2 relative">
                                  <div className="flex flex-wrap gap-2">
                                    {selectedStore?.documents?.length ? (
                                      <>
                                        {selectedStore.documents.map((doc, i) => (
                                          <Badge key={i} variant="outline" className="flex gap-1 items-center">
                                            <FileText className="h-3 w-3" />
                                            {doc}
                                            <Button 
                                              type="button" 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-4 w-4 p-0 ml-1 hover:bg-muted rounded-full"
                                              onClick={() => {
                                                if(selectedStore) {
                                                  setSelectedStore({
                                                    ...selectedStore,
                                                    documents: selectedStore.documents?.filter((_, index) => index !== i)
                                                  });
                                                }
                                              }}
                                            >
                                              <XCircle className="h-3 w-3" />
                                            </Button>
                                          </Badge>
                                        ))}
                                      </>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">Click to choose files</p>
                                    )}
                                  </div>
                                  <Input 
                                    id="editDocuments" 
                                    type="file" 
                                    multiple
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                </div>
                              </div>
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
                              <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
                              <Button onClick={handleSaveStore}>Save</Button>
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

      {/* Sheet for Add/Edit Store */}
      <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{isEditMode ? "Edit Store" : "Add New Store"}</SheetTitle>
            <SheetDescription>
              {isEditMode 
                ? "Update the details of the existing store." 
                : "Add a new store location to your system."
              }
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input 
                id="storeName" 
                placeholder="Enter store name" 
                value={isEditMode ? selectedStore?.store_name : newStore.store_name}
                onChange={handleStoreNameChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea 
                id="address" 
                placeholder="Enter store address" 
                value={isEditMode ? selectedStore?.address : newStore.address}
                onChange={handleAddressChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactInfo">Contact Information</Label>
              <Input 
                id="contactInfo" 
                placeholder="Enter contact information" 
                value={isEditMode ? selectedStore?.contact_info : newStore.contact_info}
                onChange={handleContactInfoChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractInfo">Contract Information</Label>
              <Textarea 
                id="contractInfo" 
                placeholder="Enter contract information" 
                value={isEditMode ? selectedStore?.contractInfo : newStore.contractInfo}
                onChange={handleContractInfoChange}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="activeStatus">Status</Label>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="activeStatus" 
                    checked={isEditMode ? selectedStore?.is_active : newStore.is_active}
                    onCheckedChange={(checked) => {
                      if (isEditMode && selectedStore) {
                        setSelectedStore({
                          ...selectedStore,
                          is_active: checked,
                        });
                      } else {
                        setNewStore({
                          ...newStore,
                          is_active: checked,
                        });
                      }
                    }}
                  />
                  <Label htmlFor="activeStatus" className="text-sm font-normal">
                    {(isEditMode ? selectedStore?.is_active : newStore.is_active) ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documents">Attachments</Label>
              <div className="border rounded-md p-2 relative">
                <div className="flex flex-wrap gap-2">
                  {((isEditMode && selectedStore?.documents?.length) || 
                   (!isEditMode && newStore.documents?.length)) ? (
                    <>
                      {isEditMode && selectedStore?.documents ? 
                        selectedStore.documents.map((doc, i) => (
                          <Badge key={i} variant="outline" className="flex gap-1 items-center">
                            <FileText className="h-3 w-3" />
                            {doc}
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-4 w-4 p-0 ml-1 hover:bg-muted rounded-full"
                              onClick={() => {
                                if(selectedStore) {
                                  setSelectedStore({
                                    ...selectedStore,
                                    documents: selectedStore.documents?.filter((_, index) => index !== i)
                                  });
                                }
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </Badge>
                        )) :
                        newStore.documents?.map((doc, i) => (
                          <Badge key={i} variant="outline" className="flex gap-1 items-center">
                            <FileText className="h-3 w-3" />
                            {doc}
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-4 w-4 p-0 ml-1 hover:bg-muted rounded-full"
                              onClick={() => {
                                setNewStore({
                                  ...newStore,
                                  documents: newStore.documents?.filter((_, index) => index !== i)
                                });
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))
                      }
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Click to choose files</p>
                  )}
                </div>
                <Input 
                  id="documents" 
                  type="file" 
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSaveStore}>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Store Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-md">
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
            {storeToView?.documents && storeToView.documents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Attachments</h4>
                <div className="space-y-2">
                  {storeToView.documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc}</span>
                    </div>
                  ))}
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