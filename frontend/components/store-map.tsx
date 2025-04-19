"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useStoreView } from "./store-context";
import supabase from "@/lib/supabase";
import { Store } from "@/components/map-components";
// 客户端组件不会在服务器端渲染
const MapComponents = dynamic(
  () => import("@/components/map-components").then(mod => ({ default: mod.MapComponents })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    )
  }
);

interface StoreMapProps {
  className?: string;
}

interface StoreLocation {
  id: number;
  store_name: string;
  address: string;
  contact_info: string;
  is_active: boolean;
  latitude: number;
  longitude: number;
}

// Calculate the center of all store locations
const calculateMapCenter = (locations: StoreLocation[]) => {
  if (locations.length === 0) return [30.0, 105.0]; // Default to center of China
  
  const validLocations = locations.filter(loc => 
    loc.latitude !== null && loc.longitude !== null);
  
  if (validLocations.length === 0) return [30.0, 105.0];
  
  const totalLat = validLocations.reduce((sum, loc) => sum + loc.latitude, 0);
  const totalLng = validLocations.reduce((sum, loc) => sum + loc.longitude, 0);
  
  return [
    totalLat / validLocations.length,
    totalLng / validLocations.length
  ];
};

export function StoreMap({ className }: StoreMapProps) {
  const { storeId, isAddStoreOpen, setStoreId, setViewMode, setIsAddStoreOpen } = useStoreView();
  const [storeLocations, setStoreLocations] = React.useState<StoreLocation[]>([]);
  const [selectedStore, setSelectedStore] = React.useState<StoreLocation | null>(null);
  
  // Fetch store locations from Supabase
  React.useEffect(() => {
    async function fetchStores() {
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
            longitude
          `)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          setStoreLocations(data.map(store => ({
            id: store.store_id,
            store_name: store.store_name,
            address: store.address,
            contact_info: store.contact_info,
            is_active: store.is_active,
            latitude: store.latitude,
            longitude: store.longitude
          })));
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    }
    
    fetchStores();
    
    // 订阅实时更新
    const subscription = supabase
      .channel('stores-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, (payload) => {
        fetchStores(); // 简单起见，重新加载所有数据
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  // When a store is selected, update the context
  React.useEffect(() => {
    if (selectedStore) {
      setStoreId(selectedStore.id);
      
      // If it's in add store mode, switch to list view
      if (isAddStoreOpen) {
        setViewMode("list");
      }
    }
  }, [selectedStore, setStoreId, isAddStoreOpen, setViewMode]);
  
  // Filter out locations with invalid coordinates
  const validLocations = storeLocations.filter(
    store => typeof store.latitude === 'number' && typeof store.longitude === 'number'
  );
  
  // Center map on the average position of all stores
  const center = calculateMapCenter(validLocations);

  // Convert StoreLocation to Store for MapComponents
  const stores = validLocations.map(location => ({
    id: String(location.id),
    name: location.store_name,
    address: location.address,
    city: "",
    state: "",
    zip: "",
    country: "China",
    phone: "",
    email: location.contact_info,
    latitude: location.latitude,
    longitude: location.longitude,
    isActive: location.is_active
  }));

  // Handle a store selection from the map
  const handleSelectStore = (store: Store | null) => {
    if (store) {
      const storeLocation = validLocations.find(loc => String(loc.id) === store.id) || null;
      setSelectedStore(storeLocation);
    } else {
      setSelectedStore(null);
    }
  };

  return (
    <Card className={cn("w-full h-[500px]", className)}>
      <CardContent className="h-full p-0 pt-2 overflow-hidden">
        <MapComponents 
          center={center as [number, number]} 
          stores={stores} 
          onSelectStore={handleSelectStore}
          height="100%"
        />
      </CardContent>
    </Card>
  );
}