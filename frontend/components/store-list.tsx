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
  Plus
} from "lucide-react";

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
    updated_at: "2023-05-20T14:45:00Z"
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
    updated_at: "2023-06-05T09:20:00Z"
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
    updated_at: "2023-04-18T16:30:00Z"
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
    updated_at: "2023-07-12T13:10:00Z"
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
    updated_at: "2023-08-03T11:25:00Z"
  }
];

export function StoreList() {
  const [stores, setStores] = useState<StoreData[]>(mockStores);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [newStore, setNewStore] = useState<Partial<StoreData>>({
    store_name: "",
    address: "",
    contact_info: "",
    is_active: true,
    latitude: null,
    longitude: null
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<number | null>(null);

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

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseFloat(e.target.value) : null;
    if (isEditMode && selectedStore) {
      setSelectedStore({ ...selectedStore, latitude: value });
    } else {
      setNewStore({ ...newStore, latitude: value });
    }
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseFloat(e.target.value) : null;
    if (isEditMode && selectedStore) {
      setSelectedStore({ ...selectedStore, longitude: value });
    } else {
      setNewStore({ ...newStore, longitude: value });
    }
  };

  const handleIsActiveChange = (checked: boolean) => {
    if (isEditMode && selectedStore) {
      setSelectedStore({ ...selectedStore, is_active: checked });
    } else {
      setNewStore({ ...newStore, is_active: checked });
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
      latitude: null,
      longitude: null
    });
    setIsOpen(true);
  };

  // Open the form for editing an existing store
  const handleEditStore = (store: StoreData) => {
    setIsEditMode(true);
    setSelectedStore(store);
    setIsOpen(true);
  };

  // Confirm delete dialog
  const handleDeleteClick = (storeId: number) => {
    setStoreToDelete(storeId);
    setIsDeleteDialogOpen(true);
  };

  // Delete a store
  const handleDeleteStore = () => {
    if (storeToDelete !== null) {
      setStores(stores.filter(store => store.store_id !== storeToDelete));
      setIsDeleteDialogOpen(false);
      setStoreToDelete(null);
    }
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
        latitude: newStore.latitude ?? null,
        longitude: newStore.longitude ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setStores([...stores, storeData]);
    }
    
    // Close the form
    setIsOpen(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Stores Management</h2>
        <Button onClick={handleAddStore}>
          <Plus className="mr-2 h-4 w-4" /> Add Store
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stores</CardTitle>
          <CardDescription>Manage your store locations and details.</CardDescription>
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
              {stores.map((store) => (
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
                      <Button variant="outline" size="icon" onClick={() => handleEditStore(store)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteClick(store.store_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sheet for Add/Edit Store */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input 
                  id="latitude" 
                  type="number" 
                  step="0.000001"
                  placeholder="Enter latitude" 
                  value={(isEditMode ? selectedStore?.latitude : newStore.latitude) ?? ''}
                  onChange={handleLatitudeChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input 
                  id="longitude" 
                  type="number" 
                  step="0.000001"
                  placeholder="Enter longitude" 
                  value={(isEditMode ? selectedStore?.longitude : newStore.longitude) ?? ''}
                  onChange={handleLongitudeChange}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="isActive" 
                checked={isEditMode ? selectedStore?.is_active : newStore.is_active}
                onCheckedChange={handleIsActiveChange}
              />
              <Label htmlFor="isActive">Active</Label>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this store? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStore}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 