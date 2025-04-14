"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Store, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// 自定义标记图标
const createCustomIcon = (isActive: boolean) => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div class="w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-primary' : 'bg-secondary'} text-white shadow-lg transform transition-transform hover:scale-110">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M18 12V7"/><path d="M14 7v5a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M10 12V7"/><path d="M6 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M2 7h20"/></svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// Define the store data structure - should match the one in store-map.tsx
interface StoreLocation {
  id: number;
  store_name: string;
  address: string;
  contact_info: string;
  is_active: boolean;
  latitude: number;
  longitude: number;
}

interface MapComponentsProps {
  center: number[];
  locations: StoreLocation[];
  onSelectStore: (store: StoreLocation | null) => void;
}

export default function MapComponents({ center, locations, onSelectStore }: MapComponentsProps) {
  return (
    <MapContainer 
      center={[center[0], center[1]]} 
      zoom={4} 
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
      zoomControl={false}
    >
      {/* 更美观的地图样式 */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://www.mapbox.com/">Mapbox</a>'
        url="https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"
      />
      
      {/* 将放大缩小控件放到右上角 */}
      <ZoomControl position="topright" />
      
      {locations.map((store) => (
        <Marker 
          key={store.id}
          position={[store.latitude, store.longitude]}
          icon={createCustomIcon(store.is_active)}
          eventHandlers={{
            click: () => {
              onSelectStore(store);
            },
          }}
        >
          <Popup className="store-popup">
            <div className="min-w-[220px]">
              <h3 className="font-semibold text-base mb-2 pb-2 border-b flex items-center gap-2">
                <Store className="h-4 w-4" />
                {store.store_name}
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{store.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{store.contact_info}</span>
                </div>
                <div className="pt-2">
                  <Badge variant={store.is_active ? "default" : "secondary"} className="text-xs">
                    {store.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 