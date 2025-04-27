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
import { StoreDetailsDialog } from "@/components/store/store-details-dialog";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import * as LMarkerCluster from "leaflet.markercluster";
import "leaflet.markercluster";

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

// Custom cluster icon with count
const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `
      <div class="w-12 h-12 rounded-full flex items-center justify-center bg-gray-800 text-white shadow-xl text-lg font-bold">
        ${count}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
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
  contract_info?: string;
  contract_file_url?: string;
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
      
      .custom-cluster-icon {
        background: transparent !important;
        border: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Component to manage the marker cluster group
  const MarkerClusterGroupComponent: React.FC = () => {
    const map = useMap();

    React.useEffect(() => {
      // Create a MarkerClusterGroup
      const markerClusterGroup = L.markerClusterGroup({
        iconCreateFunction: createClusterIcon,
        maxClusterRadius: 80, // Adjust this value to control clustering distance
        spiderfyOnMaxZoom: true,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 15, // Stop clustering at this zoom level
      });

      // Add individual markers to the cluster group
      activeStores.forEach((store) => {
        const marker = L.marker([store.latitude, store.longitude], {
          icon: createCustomIcon(store.isActive),
        });

        marker.bindPopup(
          L.popup().setContent(
            `
            <div class="min-w-[280px] border-none shadow-lg rounded-xl bg-white transition-all duration-300 hover:shadow-xl">
              <div class="px-3 pt-2 py-3">
                <div class="text-[16px] font-medium flex items-center gap-2 text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500">
                    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
                    <path d="M2 7h20"/>
                  </svg>
                  ${store.store_name}
                  <button id="view-details-${store.id}" class="mr-auto hover:bg-gray-100 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="pb-1 px-3 space-y-3">
                <div class="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 shrink-0 mt-0.5">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span class="text-sm text-gray-600 leading-relaxed">${store.address}</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-1 text-gray-400">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/>
                  </svg>
                  <span class="text-sm text-gray-600 leading-relaxed mb-[2px]">${store.contact_info}</span>
                </div>
              </div>
            </div>
            `
          )
        );

        // Remove the custom click listener that might interfere with the default popup opening
        // marker.on('click', () => {
        //   onSelectStore(store);
        // });

        // Add event listener for the "View Details" button in the popup
        marker.on('popupopen', () => {
          const button = document.getElementById(`view-details-${store.id}`);
          if (button) {
            button.addEventListener('click', () => {
              handleViewDetails(store);
            });
          }
        });

        markerClusterGroup.addLayer(marker);
      });

      // Add the cluster group to the map
      map.addLayer(markerClusterGroup);

      // Clean up on unmount
      return () => {
        map.removeLayer(markerClusterGroup);
      };
    }, [map, activeStores]);

    return null;
  };

  return (
    <div className="relative h-full w-full">
      {/* Initialize Leaflet icons */}
      <MapIconSetup />
      
      <MapContainer 
        center={[center[0], center[1]]} 
        zoom={zoom} 
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
        
        <MarkerClusterGroupComponent />
      </MapContainer>

      {/* Store Details Dialog */}
      <StoreDetailsDialog
        store={storeToView}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
}