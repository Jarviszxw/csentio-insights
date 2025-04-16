"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Phone, Edit, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

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
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
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
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        border: none;
        overflow: hidden;
        padding: 0;
      }
      
      .leaflet-popup-content {
        margin: 0;
        width: auto !important;
      }
      
      .leaflet-popup-tip {
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
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
        {/* Map style - improved cartography */}
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
              <div className="min-w-[280px]">
                <div className="bg-gray-100 p-3 border-b border-gray-200">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-gray-700" />
                      {store.name}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onSelectStore(store)}
                      className="h-8 px-2"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </h3>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                    <span className="text-sm">{store.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-600" />
                    <span className="text-sm">{store.phone}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}