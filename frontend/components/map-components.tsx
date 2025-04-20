"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Phone, Building2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { StoreDetailsDialog } from "@/components/store-details-dialog"; // 导入新组件

// Fix the marker icon issue in Leaflet with Next.js
function MapIconSetup() {
  React.useEffect(() => {
    (async function init() {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    })();
  }, []);
  
  return null;
}

// Custom marker icon with black and white colors
const createCustomIcon = (isActive: boolean) => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div class="w-10 h-10 rounded-full flex items-center justify-center 
           ${isActive ? 'bg-gray-800' : 'bg-gray-500'} 
           text-white shadow-xl transform transition-all duration-300 hover:scale-110 
           hover:${isActive ? 'bg-gray-900' : 'bg-gray-600'} marker-animation">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
          <path d="M2 7h20"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// Define the store data structure
export interface Store {
  id: string;
  store_name: string;
  address: string;
  contact_info: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  contract_info?: string; // 添加字段
  contract_file_url?: string; // 添加字段
}

export interface MapComponentsProps {
  stores: Store[];
  onSelectStore: (store: Store | null) => void;
  height?: string;
  width?: string;
  zoom?: number;
  center: [number, number];
  className?: string;
}

// Main component
export function MapComponents({
  stores,
  onSelectStore,
  height = "600px",
  width = "100%",
  zoom = 4,
  center = [39.8283, -98.5795],
  className,
}: MapComponentsProps) {
  const mapRef = React.useRef<L.Map | null>(null);
  
  // Filter only active stores
  const activeStores = stores.filter(store => store.isActive);

  // State for dialog
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [storeToView, setStoreToView] = React.useState<Store | null>(null);

  // Handle view details
  const handleViewDetails = (store: Store) => {
    setStoreToView(store);
    setIsDetailsDialogOpen(true);
  };
  
  // Add custom styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .marker-animation {
        animation: bounce 0.5s ease-out;
      }
      
      @keyframes bounce {
        0% {
          transform: translateY(-50px);
          opacity: 0;
        }
        60% {
          transform: translateY(5px);
          opacity: 1;
        }
        100% {
          transform: translateY(0);
        }
      }
      
      .pulse-animation {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(255, 255, 255, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
        }
      }
      
      .leaflet-popup-content-wrapper {
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: none;
        overflow: hidden;
        padding: 0;
        background: transparent;
      }
      
      .leaflet-popup-content {
        margin: 0;
        width: auto !important;
      }
      
      .leaflet-popup-tip {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        background: #ffffff;
      }
      
      .store-popup .leaflet-popup-content-wrapper {
        border: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div className="relative h-full w-full">
      {/* Initialize Leaflet icons */}
      <MapIconSetup />
      
      <MapContainer 
        center={[center[0], center[1]]} 
        zoom={4} 
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
        zoomControl={false}
        className="z-0 shadow-lg border border-gray-200"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {activeStores.map((store) => (
          <Marker 
            key={store.id}
            position={[store.latitude, store.longitude]}
            icon={createCustomIcon(store.isActive)}
            eventHandlers={{
              click: () => {
                onSelectStore(store);
              },
            }}
          >
            <Popup className="store-popup">
              <Card className="min-w-[280px] border-none shadow-lg rounded-xl bg-white transition-all duration-300 hover:shadow-xl">
                <CardHeader className="px-4">
                  <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-900">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    {store.store_name}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewDetails(store)} // 修改为调用 handleViewDetails
                      className="ml-auto hover:bg-gray-100 rounded-full"
                    >
                      <Eye className="h-5 w-5 text-gray-500" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-1 px-3 space-y-3"> 
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 leading-relaxed">{store.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="mx-1 h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 leading-relaxed">{store.contact_info}</span>
                  </div>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 添加 StoreDetailsDialog */}
      <StoreDetailsDialog
        store={storeToView}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
}