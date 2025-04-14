import { Dispatch, SetStateAction } from 'react';

declare module "../components/map-components" {
  export interface StoreLocation {
    id: number;
    store_name: string;
    address: string;
    contact_info: string;
    is_active: boolean;
    latitude: number;
    longitude: number;
  }

  export interface MapComponentsProps {
    center: number[];
    locations: StoreLocation[];
    onSelectStore: (store: StoreLocation | null) => void;
  }

  const MapComponents: React.FC<MapComponentsProps>;
  export default MapComponents;
} 