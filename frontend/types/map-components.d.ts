import { Dispatch, SetStateAction } from 'react';

declare module "../components/map-components" {
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

  export function MapComponents(props: MapComponentsProps): JSX.Element;
}