// Define shared data structure
export interface StoreData {
  store_id: number;
  store_name: string;
  address: string;
  contact_info: string;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  city_id: number | null;
  created_at: string;
  updated_at: string;
  contract_file_url?: string | undefined; // Correct type
  contract_info?: string;
}

// City data structure if needed elsewhere
export interface CityData {
  id: number;
  city_name: string;
  country: string;
} 