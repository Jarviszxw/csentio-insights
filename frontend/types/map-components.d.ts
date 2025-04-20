declare module "../components/map-components" {
  export interface Store {
    id: string;
    store_name: string;
    address: string;
    contact_info: string;
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