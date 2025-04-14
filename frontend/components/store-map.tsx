"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// 客户端组件不会在服务器端渲染
const MapComponents = dynamic(
  () => import("../components/map-components"),
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

// Define the store data structure
interface StoreLocation {
  id: number;
  store_name: string;
  address: string;
  contact_info: string;
  is_active: boolean;
  latitude: number;
  longitude: number;
}

// Mock data for store locations
const mockStoreLocations: StoreLocation[] = [
  {
    id: 1,
    store_name: "Store Shanghai",
    address: "123 Nanjing Road, Shanghai, China",
    contact_info: "contact@shanghai.store",
    is_active: true,
    latitude: 31.2304,
    longitude: 121.4737
  },
  {
    id: 2,
    store_name: "Store Beijing",
    address: "456 Wangfujing Street, Beijing, China",
    contact_info: "contact@beijing.store",
    is_active: true,
    latitude: 39.9042,
    longitude: 116.4074
  },
  {
    id: 3,
    store_name: "Store Guangzhou",
    address: "789 Beijing Road, Guangzhou, China",
    contact_info: "contact@guangzhou.store",
    is_active: false,
    latitude: 23.1291,
    longitude: 113.2644
  },
  {
    id: 4,
    store_name: "Store Shenzhen",
    address: "321 Shennan Road, Shenzhen, China",
    contact_info: "contact@shenzhen.store",
    is_active: true,
    latitude: 22.5431,
    longitude: 114.0579
  },
  {
    id: 5,
    store_name: "Store Chengdu",
    address: "654 Chunxi Road, Chengdu, China",
    contact_info: "contact@chengdu.store",
    is_active: true,
    latitude: 30.5728,
    longitude: 104.0668
  }
];

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
  const [storeLocations, setStoreLocations] = React.useState<StoreLocation[]>(mockStoreLocations);
  const [selectedStore, setSelectedStore] = React.useState<StoreLocation | null>(null);
  
  // Filter out locations with invalid coordinates
  const validLocations = storeLocations.filter(
    store => typeof store.latitude === 'number' && typeof store.longitude === 'number'
  );
  
  // Center map on the average position of all stores
  const center = calculateMapCenter(validLocations);

  return (
    <Card className={cn("w-full h-[500px]", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Store className="h-5 w-5" />
          Store Locations Map
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)]">
        <MapComponents 
          center={center} 
          locations={validLocations} 
          onSelectStore={setSelectedStore}
        />
      </CardContent>
    </Card>
  );
}

// 添加到你的全局CSS文件中
// .store-popup .leaflet-popup-content-wrapper {
//   border-radius: 0.5rem;
//   box-shadow: 0 1px 2px rgba(0,0,0,0.1);
// }
// 
// .store-popup .leaflet-popup-content {
//   margin: 12px 16px;
//   line-height: 1.5;
// }
//
// .custom-marker-icon {
//   display: flex;
//   align-items: center;
//   justify-content: center;
// }