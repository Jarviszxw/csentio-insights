import { DateRange } from "react-day-picker";

// API 基础 URL
export const API_BASE_URL = 'http://localhost:8000/api';

export interface StoresInfo {
  id: string;
  name: string;
}

export interface GMVResponse {
  total_gmv: number;
  pop_percentage: number | string;
  trend: 'up' | 'down';
  error?: string;
}

export interface SalesResponse {
  total_sales: number;
  pop_percentage: number | string;
  trend: 'up' | 'down';
  error?: string;
}

export interface StoresResponse {
  total_stores: number;
  added: number;
  removed: number;
  net_change: number;
  trend: 'up' | 'down';
  error?: string;
}
export interface MonthlyDataItem {
  date: string;
  gmv: number;
  sales: number;
}

export interface DimensionDataItem {
  [key: string]: string | number | undefined;
  store?: string;
  product?: string;
  city?: string;
  gmv: number;
  trend?: number;
}

/**
 * 格式化日期为ISO格式的日期字符串 (YYYY-MM-DD)，避免时区问题
 */
function formatDateToISOString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取总 GMV 的函数
 * @param from 可选的开始日期
 * @param to 可选的结束日期
 * @returns 返回GMV数据对象
 */
export async function fetchTotalGMV(from?: Date, to?: Date): Promise<GMVResponse> {
  try {
    console.log("API: 开始获取GMV数据，日期范围:", { from, to });

    const params = new URLSearchParams();

    if (from) {
      const firstDayOfMonth = new Date(from.getFullYear(), from.getMonth(), 1);
      const formattedFromDate = formatDateToISOString(firstDayOfMonth);
      params.append('start_date', formattedFromDate);
      console.log("API: 使用月初日期:", formattedFromDate, "原始日期对象:", from);
    }

    if (to) {
      const lastDayOfMonth = new Date(to.getFullYear(), to.getMonth() + 1, 0);
      const formattedToDate = formatDateToISOString(lastDayOfMonth);
      params.append('end_date', formattedToDate);
      console.log("API: 使用月末日期:", formattedToDate, "原始日期对象:", to);
    }

    const url = `${API_BASE_URL}/metrics/total-gmv${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // 直接返回解析后的数据，TypeScript 应该能正确推断
    const data: GMVResponse = await response.json();
    console.log("API: 获取到GMV数据:", data);
    return data;
  } catch (error) {
    console.error('API: 获取GMV数据失败:', error);
    return {
      total_gmv: 0,
      pop_percentage: 0,
      trend: 'up',
      error: String(error)
    };
  }
}

/**
 * 获取总销售额的函数
 * @param from 可选的开始日期
 * @param to 可选的结束日期
 * @returns 返回总销售额数据对象
 */
export async function fetchTotalSales(from?: Date, to?: Date): Promise<SalesResponse> {
  try {
    console.log("API: 开始获取总销售额数据，日期范围:", { from, to });

    const params = new URLSearchParams();

    if (from) {
      const firstDayOfMonth = new Date(from.getFullYear(), from.getMonth(), 1);
      const formattedFromDate = formatDateToISOString(firstDayOfMonth);
      params.append('start_date', formattedFromDate);
      console.log("API: 使用月初日期:", formattedFromDate, "原始日期对象:", from);
    }

    if (to) {
      const lastDayOfMonth = new Date(to.getFullYear(), to.getMonth() + 1, 0);
      const formattedToDate = formatDateToISOString(lastDayOfMonth);
      params.append('end_date', formattedToDate);
      console.log("API: 使用月末日期:", formattedToDate, "原始日期对象:", to);
    }

    const url = `${API_BASE_URL}/metrics/total-sales${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: SalesResponse = await response.json();
    console.log("API: 获取到总销售额数据:", data);
    return data;
  } catch (error) {
    console.error('API: 获取总销售额数据失败:', error);
    return {
      total_sales: 0,
      pop_percentage: 0,
      trend: 'up',
      error: String(error)
    };
  }
}

/**
 * 获取月度GMV和销售数据
 * @param from 可选的开始日期
 * @param to 可选的结束日期
 * @returns 返回月度数据数组
 */
export async function fetchMonthlyData(from?: Date, to?: Date): Promise<MonthlyDataItem[]> {
  try {
    console.log("API: 开始获取月度GMV和销售数据，日期范围:", { from, to });

    const params = new URLSearchParams();

    if (from) {
      const formattedFromDate = formatDateToISOString(from);
      params.append('start_date', formattedFromDate);
      console.log("API: 使用开始日期:", formattedFromDate);
    }

    if (to) {
      const formattedToDate = formatDateToISOString(to);
      params.append('end_date', formattedToDate);
      console.log("API: 使用结束日期:", formattedToDate);
    }

    const url = `${API_BASE_URL}/metrics/monthly-data${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("API: 获取到月度数据:", data);

    if (!Array.isArray(data)) {
      throw new Error("API返回的月度数据格式不正确");
    }

    return data as MonthlyDataItem[];
  } catch (error) {
    console.error('API: 获取月度数据失败:', error);
    // 返回空数组，由调用方决定是否使用默认数据
    return [];
  }
}

/**
 * 获取总店铺数量的函数
 * @param from 可选的开始日期
 * @param to 可选的结束日期
 * @returns 返回总店铺数量数据对象
 */
export async function fetchTotalStores(from?: Date, to?: Date): Promise<StoresResponse> {
  try {
    console.log("API: 开始获取总店铺数量数据，日期范围:", { from, to });

    const params = new URLSearchParams();

    if (from) {
      const formattedFromDate = formatDateToISOString(from);
      params.append('start_date', formattedFromDate);
      console.log("API: 使用开始日期:", formattedFromDate);
    }

    if (to) {
      const formattedToDate = formatDateToISOString(to);
      params.append('end_date', formattedToDate);
      console.log("API: 使用结束日期:", formattedToDate);
    }

    const url = `${API_BASE_URL}/metrics/total-stores${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: StoresResponse = await response.json();
    console.log("API: 获取到总店铺数量数据:", data);
    return data;
  } catch (error) {
    console.error('API: 获取总店铺数量数据失败:', error);
    return {
      total_stores: 0,
      added: 0,
      removed: 0,
      net_change: 0,
      trend: 'up',
      error: String(error)
    };
  }
}

/**
 * 获取按维度的GMV数据
 * @param dimension 维度，如"store", "product", "city"
 * @param from 可选的开始日期
 * @param to 可选的结束日期
 * @param limit 可选的结果数量限制
 * @returns 返回维度数据数组
 */
export async function fetchGMVByDimension(
  dimension: string,
  from?: Date,
  to?: Date,
  limit: number = 6
): Promise<DimensionDataItem[]> {
  try {
    console.log(`API: 开始获取按${dimension}维度的GMV数据，日期范围:`, { from, to });

    const params = new URLSearchParams();
    params.append('dimension', dimension);

    if (from) {
      const formattedFromDate = formatDateToISOString(from);
      params.append('start_date', formattedFromDate);
      console.log("API: 使用开始日期:", formattedFromDate);
    }

    if (to) {
      const formattedToDate = formatDateToISOString(to);
      params.append('end_date', formattedToDate);
      console.log("API: 使用结束日期:", formattedToDate);
    }

    if (limit) {
      params.append('limit', limit.toString());
    }

    const url = `${API_BASE_URL}/metrics/gmv-by-dimension${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`API: 获取到按${dimension}维度的GMV数据:`, data);

    if (!Array.isArray(data)) {
      throw new Error(`API返回的${dimension}维度数据格式不正确`);
    }

    return data as DimensionDataItem[];
  } catch (error) {
    console.error(`API: 获取按${dimension}维度的GMV数据失败:`, error);
    // 返回空数组，由调用方决定是否使用默认数据
    return [];
  }
}

/**
 * 检查API连接状态
 * @returns 布尔值表示是否成功连接
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return response.ok;
  } catch (error) {
    console.error('API: 连接测试失败:', error);
    return false;
  }
}

export async function fetchStores(): Promise<StoresInfo[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(`${API_BASE_URL}/info/stores`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal: controller.signal
  });

  clearTimeout(timeoutId);
  if (!response.ok) {
    throw new Error('Failed to fetch stores');
  }

  const data: StoresInfo[] = await response.json();
  console.log("API: 获取到所有店铺数据:", data);
  return data;
}


// --- Inventory Section ---

// Interfaces for Inventory Section

// Product Information (used in various responses and dialogs)
export interface ProductInfo {
  id: string; // Or number, depending on your DB schema
  name: string; // skuName
  code: string; // skuCode
  // Add other relevant product details if needed
}

// Structure for SKU details within statistics
interface SkuStatistic {
  id: string | number; // Can be product ID or a unique identifier for the stat line
  name: string; // skuName
  quantity: number;
}

// Response for Inventory Statistics API
export interface InventoryStatisticsResponse {
  sample: {
    totalQuantity: number;
    skuDetails: SkuStatistic[];
  };
  inventory: {
    totalQuantity: number;
    skuDetails: SkuStatistic[];
  };
  error?: string;
}

// Response for Inventory Distribution (Bar Chart) API
// Assuming it returns an array of products with their non-sample quantities
export interface InventoryDistributionItem {
    name: string; // skuCode or skuName, matching the chart's XAxis dataKey
    quantity: number;
}
export type InventoryDistributionResponse = InventoryDistributionItem[];

// Represents a single inventory record (matching table columns)
export interface InventoryRecord {
  id: string; // Or number
  createTime: string; // ISO date string
  inventory_date: string; // YYYY-MM-DD string
  store: string; // Store name or ID, adjust based on backend response
  storeId?: string; // Might be useful to have ID separate from name
  skuName: string;
  skuCode: string;
  productId?: string; // Might be useful to have ID separate from name/code
  quantity: number;
  trackingNo?: string;
  remarks?: string;
  createdBy: string; // User name or ID
}

// Response for fetching inventory records (includes pagination info)
export interface PaginatedInventoryResponse {
  records: InventoryRecord[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  error?: string;
}

// Data structure for creating a new inventory record via API
export interface NewInventoryRecordData {
  inventory_date: string; // YYYY-MM-DD
  storeId: string; // ID of the store
  productId: string; // ID of the product
  quantity: number;
  remarks?: string;
  trackingNo?: string; // Optional based on your form/requirements
  // createdBy will likely be handled by the backend based on authentication
}

// Data structure for updating an existing inventory record via API
// Usually includes a subset of fields that are editable
export interface UpdateInventoryRecordData {
  inventory_date?: string; // YYYY-MM-DD
  storeId?: string;
  productId?: string;
  quantity?: number;
  remarks?: string;
  trackingNo?: string;
}


// API Functions for Inventory Section

/**
 * Fetches inventory statistics (total sample, total inventory, and SKU breakdowns).
 * @param storeId Optional store ID to filter statistics. Defaults to 'all'.
 */
export async function fetchInventoryStatistics(storeId: string = 'all'): Promise<InventoryStatisticsResponse> {
  try {
    console.log(`API: Fetching inventory statistics for store: ${storeId}`);
    const params = new URLSearchParams();
    if (storeId && storeId !== 'all') {
      params.append('store_id', storeId);
    }

    const url = `${API_BASE_URL}/inventory/statistics${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: Request URL:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: InventoryStatisticsResponse = await response.json();
    console.log("API: Received inventory statistics:", data);
    return data;
  } catch (error) {
    console.error('API: Failed to fetch inventory statistics:', error);
    // Return a default error structure matching the expected response type
    return {
      sample: { totalQuantity: 0, skuDetails: [] },
      inventory: { totalQuantity: 0, skuDetails: [] },
      error: String(error)
    };
  }
}

/**
 * Fetches inventory distribution data (e.g., for bar chart).
 * Excludes sample quantities by default based on user request.
 * @param storeId Optional store ID to filter distribution. Defaults to 'all'.
 */
export async function fetchInventoryDistribution(storeId: string = 'all'): Promise<InventoryDistributionResponse> {
   try {
    console.log(`API: Fetching inventory distribution for store: ${storeId}`);
    const params = new URLSearchParams();
    if (storeId && storeId !== 'all') {
      params.append('store_id', storeId);
    }
    // Optional: Add param if backend needs explicit instruction to exclude samples
    // params.append('exclude_samples', 'true');

    const url = `${API_BASE_URL}/inventory/distribution${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: Request URL:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: InventoryDistributionResponse = await response.json();
    console.log("API: Received inventory distribution:", data);
    return data;
  } catch (error) {
    console.error('API: Failed to fetch inventory distribution:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Fetches paginated inventory records.
 * @param params Parameters including storeId, page, limit, sortBy, sortOrder.
 */
export async function fetchInventoryRecords(params: {
  storeId?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<PaginatedInventoryResponse> {
  try {
    const { storeId = 'all', page, limit, sortBy, sortOrder } = params;
    console.log(`API: Fetching inventory records:`, params);

    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (storeId && storeId !== 'all') {
      queryParams.append('store_id', storeId);
    }
    if (sortBy) {
      queryParams.append('sort_by', sortBy);
    }
    if (sortOrder) {
      queryParams.append('sort_order', sortOrder);
    }

    const url = `${API_BASE_URL}/inventory/records?${queryParams.toString()}`;
    console.log("API: Request URL:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Slightly longer timeout for potentially larger data

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: PaginatedInventoryResponse = await response.json();
    console.log("API: Received inventory records:", data);
    // Add basic validation if needed (e.g., check if records is an array)
    return data;

  } catch (error) {
    console.error('API: Failed to fetch inventory records:', error);
    return {
      records: [],
      totalRecords: 0,
      totalPages: 0,
      currentPage: params.page,
      error: String(error)
    };
  }
}

/**
 * Adds one or more new inventory records.
 * @param recordsData An array of new record data objects.
 */
export async function addInventoryRecords(recordsData: NewInventoryRecordData[]): Promise<{ success: boolean; error?: string, createdIds?: string[] }> {
  try {
    console.log(`API: Adding ${recordsData.length} new inventory record(s)`);
    const url = `${API_BASE_URL}/inventory/records`;
    console.log("API: Request URL:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordsData), // Send array directly
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        // Attempt to parse error message from backend if available
        let errorBody = 'Request failed';
        try {
            const errorData = await response.json();
            errorBody = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (parseError) {
            // Ignore if response body is not JSON or empty
            errorBody = `API request failed with status ${response.status}`;
        }
      throw new Error(errorBody);
    }

    // Assuming backend returns { success: true, createdIds: [...] } on success
    const result = await response.json();
    console.log("API: Add inventory records successful:", result);
    return { success: true, createdIds: result.createdIds };

  } catch (error) {
    console.error('API: Failed to add inventory records:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Updates an existing inventory record.
 * @param recordId The ID of the record to update.
 * @param recordData The data to update.
 */
export async function updateInventoryRecord(recordId: string, recordData: UpdateInventoryRecordData): Promise<{ success: boolean; error?: string }> {
   try {
    console.log(`API: Updating inventory record ID: ${recordId}`);
    const url = `${API_BASE_URL}/inventory/records/${recordId}`;
    console.log("API: Request URL:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'PUT', // Or PATCH depending on backend implementation
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
         let errorBody = 'Update failed';
        try {
            const errorData = await response.json();
            errorBody = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (parseError) {
            errorBody = `API request failed with status ${response.status}`;
        }
      throw new Error(errorBody);
    }

    // Assuming backend returns { success: true } or similar on success
    await response.json(); // Consume response body if necessary
    console.log("API: Update inventory record successful");
    return { success: true };

  } catch (error) {
    console.error(`API: Failed to update inventory record ${recordId}:`, error);
    return { success: false, error: String(error) };
  }
}


/**
 * Fetches available products (SKUs) for selection.
 */
export async function fetchProducts(): Promise<ProductInfo[]> {
  try {
    console.log("API: Fetching products");
    const url = `${API_BASE_URL}/info/products`; // Assuming endpoint exists
    console.log("API: Request URL:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: ProductInfo[] = await response.json();
    console.log("API: Received products:", data);
    return data;
  } catch (error) {
    console.error('API: Failed to fetch products:', error);
    return []; // Return empty array on error
  }
}
