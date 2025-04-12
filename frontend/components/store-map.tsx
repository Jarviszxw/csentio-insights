"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

// Fix for Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Store {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

const initialStores: Store[] = [
  { id: "1", name: "Store A - Beijing", latitude: 39.9042, longitude: 116.4074 },
  { id: "2", name: "Store B - Shanghai", latitude: 31.2304, longitude: 121.4737 },
  { id: "3", name: "Store C - Guangzhou", latitude: 23.1291, longitude: 113.2644 },
];

export function StoreMap() {
  const [stores, setStores] = React.useState<Store[]>(initialStores);
  const [newStore, setNewStore] = React.useState<Partial<Store>>({});
  const [editStore, setEditStore] = React.useState<Store | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const handleAddStore = () => {
    if (newStore.name && newStore.latitude && newStore.longitude) {
      setStores([
        ...stores,
        {
          id: Date.now().toString(),
          name: newStore.name,
          latitude: newStore.latitude,
          longitude: newStore.longitude,
        },
      ]);
      setNewStore({});
      setIsAddDialogOpen(false);
    }
  };

  const handleEditStore = () => {
    if (editStore && editStore.name && editStore.latitude && editStore.longitude) {
      setStores(
        stores.map((store) =>
          store.id === editStore.id
            ? { ...store, name: editStore.name, latitude: editStore.latitude, longitude: editStore.longitude }
            : store
        )
      );
      setEditStore(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteStore = (id: string) => {
    setStores(stores.filter((store) => store.id !== id));
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Store Locations</CardTitle>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Store</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Store</DialogTitle>
                <DialogDescription>Enter the details of the new store location.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newStore.name || ""}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="latitude" className="text-right">
                    Latitude
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    value={newStore.latitude || ""}
                    onChange={(e) => setNewStore({ ...newStore, latitude: parseFloat(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="longitude" className="text-right">
                    Longitude
                  </Label>
                  <Input
                    id="longitude"
                    type="number"
                    value={newStore.longitude || ""}
                    onChange={(e) => setNewStore({ ...newStore, longitude: parseFloat(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddStore}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full">
          <MapContainer
            center={[35.8617, 104.1954]} // Center of China
            zoom={4}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {stores.map((store) => (
              <Marker key={store.id} position={[store.latitude, store.longitude]}>
                <Popup>
                  <div className="flex flex-col gap-2">
                    <strong>{store.name}</strong>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditStore(store);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteStore(store.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Store</DialogTitle>
              <DialogDescription>Modify the details of the store location.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editStore?.name || ""}
                  onChange={(e) =>
                    setEditStore((prev) => prev ? { ...prev, name: e.target.value } : null)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-latitude" className="text-right">
                  Latitude
                </Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  value={editStore?.latitude || ""}
                  onChange={(e) =>
                    setEditStore((prev) => prev ? { ...prev, latitude: parseFloat(e.target.value) } : null)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-longitude" className="text-right">
                  Longitude
                </Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  value={editStore?.longitude || ""}
                  onChange={(e) =>
                    setEditStore((prev) => prev ? { ...prev, longitude: parseFloat(e.target.value) } : null)
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleEditStore}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}