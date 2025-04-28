import { DateRange } from "react-day-picker";
// Import the default export from the correct relative path
import supabase from './supabase';
import { Session } from '@supabase/supabase-js';

// API 基础 URL - 优先使用环境变量，否则根据环境使用适当的默认值
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://csentio-insights-backend.vercel.app/api' 
    : 'http://localhost:8000/api');

// 在初始化时输出当前使用的API URL
console.log(`API: 使用API基础URL: ${API_BASE_URL}, 环境: ${process.env.NODE_ENV}`);

export interface StoresInfo {
  store_id: number;
  store_name: string;
  // Add other fields returned by the API if needed by the frontend
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
 * Helper function to make authenticated API requests.
 * Retrieves the current session token and adds it to the Authorization header.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  console.log("[fetchWithAuth] Attempting fetch:", url);

  async function getSessionAndToken(): Promise<{ session: Session | null, token: string | null }> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("[fetchWithAuth] Error getting session:", sessionError);
      throw new Error('Failed to get authentication session.');
    }
    return { session, token: session?.access_token || null };
  }

  let { session, token } = await getSessionAndToken();

  console.log("[fetchWithAuth] Initial session exists:", !!session);
  console.log("[fetchWithAuth] Initial token exists:", !!token);

  if (!session || !token) {
    console.warn("[fetchWithAuth] No active session or token found initially.");
    throw new Error('User is not authenticated.'); // Force error if no initial session
  }

  const headers = new Headers(options.headers);

  function setAuthHeader(currentToken: string) {
    headers.set('Authorization', `Bearer ${currentToken}`);
    console.log("[fetchWithAuth] Set Authorization header.");
  }

  setAuthHeader(token);

  // Ensure common headers are present
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase()) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add timeout logic using AbortController
  const controller = new AbortController();
  // Use provided signal's timeout or default 30s
  const timeoutDuration = options.signal?.aborted ? 0 : 30000; 
  const timeoutId = timeoutDuration > 0 ? setTimeout(() => {
    console.warn(`fetchWithAuth: Request to ${url} timed out after ${timeoutDuration}ms.`);
    controller.abort();
  }, timeoutDuration) : null;

  try {
    console.log(`[fetchWithAuth] Making request to ${url}...`);
    let response = await fetch(url, {
      ...options,
      headers: headers,
      // Use the abort controller signal. If options already has one, prioritize it?
      // For simplicity, using our controller here.
      signal: controller.signal 
    });

    if (timeoutId) clearTimeout(timeoutId); // Clear timeout if request completes

    // Optional: Check for 401 specifically and maybe trigger sign-out
    if (response.status === 401) {
      console.warn("[fetchWithAuth] Received 401 Unauthorized. Attempting token refresh...");
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("[fetchWithAuth] Error refreshing session:", refreshError);
          throw new Error("Session refresh failed, user needs to re-login.");
        }

        // Get the new session and token
        const { session: newSession, token: newToken } = await getSessionAndToken();

        if (!newSession || !newToken) {
          console.error("[fetchWithAuth] No session or token after successful refresh call.");
          throw new Error("Session unavailable after refresh, user needs to re-login.");
        }

        console.log("[fetchWithAuth] Session refreshed successfully. Retrying request...");
        token = newToken; // Update token for potential future use in this scope (though unlikely needed)
        setAuthHeader(newToken); // Update header with the new token

        // Retry the request with the new token
        response = await fetch(url, { ...options, headers: headers, signal: controller.signal });

        // Check status again after retry
        if (response.status === 401) {
          console.error("[fetchWithAuth] Received 401 Unauthorized even after refresh.");
          throw new Error("Authentication failed after token refresh.");
        }

      } catch (refreshOrRetryError) {
        console.error("[fetchWithAuth] Error during token refresh or retry:", refreshOrRetryError);
        // Here you might want to trigger a sign-out and redirect to login
        // Example: supabase.auth.signOut().then(() => window.location.href = '/login');
        throw refreshOrRetryError; // Re-throw the error to be caught by the outer catch block
      }
    }

    return response;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId); // Ensure timeout is cleared on error too
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`fetchWithAuth: Request to ${url} failed: Request timed out or aborted.`);
    } else {
      console.error(`fetchWithAuth: Request to ${url} failed:`, error);
    }
    // Re-throw the error so the calling function can handle it
    throw error;
  }
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

function getMonthRange(date: Date): { start: Date; end: Date } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}

/**
 * 获取总 GMV 的函数
 * @param from 可选的开始日期
 * @param to 可选的结束日期
 * @param storeId 可选的店铺ID
 * @returns 返回GMV数据对象
 */
export async function fetchTotalGMV(from?: Date, to?: Date, storeId?: string): Promise<GMVResponse> {
  try {
    console.log("API: 开始获取GMV数据，日期范围:", { from, to, storeId });
    const params = new URLSearchParams();

    if (from) {
      const { start } = getMonthRange(from);
      const formattedFromDate = formatDateToISOString(start);
      params.append('start_date', formattedFromDate);
      console.log("API: 使用月初日期:", formattedFromDate);
    }

    if (to) {
      const { end } = getMonthRange(to);
      const formattedToDate = formatDateToISOString(end);
      params.append('end_date', formattedToDate);
      console.log("API: 使用月末日期:", formattedToDate);
    }

    // Add store_id if provided and not 'all'
    if (storeId && storeId !== 'all') {
      params.append('store_id', storeId);
      console.log("API: 使用店铺ID:", storeId);
    }

    const url = `${API_BASE_URL}/metrics/total-gmv${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);

    // Use fetchWithAuth
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: { // fetchWithAuth will add Authorization, keep other specific headers if needed
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
      // Timeout is handled within fetchWithAuth
    });

    if (!response.ok) {
      // fetchWithAuth might have already logged 401, but we can add specific error context here
      const errorText = await response.text().catch(() => `Status: ${response.status}`);
      throw new Error(`API request failed for fetchTotalGMV: ${errorText}`);
    }

    const data: GMVResponse = await response.json();
    console.log("API: 获取到GMV数据:", data);
    return data;
  } catch (error) {
    // Error logging is handled in fetchWithAuth, but add specific context
    console.error('API: 获取GMV数据最终失败:', error);
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
 * @param storeId 可选的店铺ID
 * @returns 返回总销售额数据对象
 */
export async function fetchTotalSales(from?: Date, to?: Date, storeId?: string): Promise<SalesResponse> {
  try {
    console.log("API: 开始获取总销售额数据，日期范围:", { from, to, storeId });
    const params = new URLSearchParams();

    if (from) {
      const { start } = getMonthRange(from);
      const formattedFromDate = formatDateToISOString(start);
      params.append('start_date', formattedFromDate);
      console.log("API: 使用月初日期:", formattedFromDate);
    }

    if (to) {
      const { end } = getMonthRange(to);
      const formattedToDate = formatDateToISOString(end);
      params.append('end_date', formattedToDate);
      console.log("API: 使用月末日期:", formattedToDate);
    }

    // Add store_id if provided and not 'all'
    if (storeId && storeId !== 'all') {
      params.append('store_id', storeId);
      console.log("API: 使用店铺ID:", storeId);
    }

    const url = `${API_BASE_URL}/metrics/total-sales${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);

    // Use fetchWithAuth
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: { // fetchWithAuth will add Authorization, keep other specific headers if needed
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
       const errorText = await response.text().catch(() => `Status: ${response.status}`);
       throw new Error(`API request failed for fetchTotalSales: ${errorText}`);
    }

    const data: SalesResponse = await response.json();
    console.log("API: 获取到总销售额数据:", data);
    return data;
  } catch (error) {
    console.error('API: 获取总销售额数据最终失败:', error);
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

    // Use fetchWithAuth
    const response = await fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
       const errorText = await response.text().catch(() => `Status: ${response.status}`);
       throw new Error(`API request failed for fetchMonthlyData: ${errorText}`);
    }

    const data = await response.json();
    console.log("API: 获取到月度数据:", data);

    if (!Array.isArray(data)) {
      throw new Error("API返回的月度数据格式不正确");
    }

    return data as MonthlyDataItem[];
  } catch (error) {
    console.error('API: 获取月度数据最终失败:', error);
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

    // Use fetchWithAuth
    const response = await fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
       const errorText = await response.text().catch(() => `Status: ${response.status}`);
       throw new Error(`API request failed for fetchTotalStores: ${errorText}`);
    }

    const data: StoresResponse = await response.json();
    console.log("API: 获取到总店铺数量数据:", data);
    return data;
  } catch (error) {
    console.error('API: 获取总店铺数量数据最终失败:', error);
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

    // Use fetchWithAuth
    const response = await fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
       const errorText = await response.text().catch(() => `Status: ${response.status}`);
       throw new Error(`API request failed for fetchGMVByDimension (${dimension}): ${errorText}`);
    }

    const data = await response.json();
    console.log(`API: 获取到按${dimension}维度的GMV数据:`, data);

    if (!Array.isArray(data)) {
      throw new Error(`API返回的${dimension}维度数据格式不正确`);
    }

    return data as DimensionDataItem[];
  } catch (error) {
    console.error(`API: 获取按${dimension}维度的GMV数据最终失败:`, error);
    return [];
  }
}

/**
 * 检查API连接状态
 * @returns 布尔值表示是否成功连接
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    // No auth needed for root usually
    const response = await fetch(`${API_BASE_URL}/`);
    return response.ok;
  } catch (error) {
    console.error('API: 连接测试失败:', error);
    return false;
  }
}


/**
 * 获取所有店铺数据
 * @returns 店铺数据数组 (matching StoresInfo)
 */
export async function fetchStores(): Promise<StoresInfo[]> {
  try {
      const url = `${API_BASE_URL}/info/stores`;
      console.log("API: 请求URL (fetchStores):", url);

      // Use fetchWithAuth
      const response = await fetchWithAuth(url, { method: 'GET' });

      if (!response.ok) {
         const errorText = await response.text().catch(() => `Status: ${response.status}`);
         throw new Error(`API request failed for fetchStores: ${errorText}`);
      }

      // Backend returns data matching StoreResponse (which likely has store_id, store_name)
      // Ensure the parsing matches the StoresInfo interface here
      const data: StoresInfo[] = await response.json(); 
      console.log("API: 获取到所有店铺数据:", data);
      return data;
   } catch (error) {
      console.error("API: 获取店铺数据最终失败:", error);
      throw error; // Re-throw so the caller knows it failed
   }
}

export interface InventoryStats {
  totalQuantity: number;
  skuDetails: { id: number; name: string; quantity: number }[];
}

export interface InventoryStatisticsResponse {
  sample: InventoryStats;
  stock: InventoryStats;
}

export interface DistributionItem {
  name: string;
  quantity: number;
}

export interface InventoryRecord {
  id: string;
  createTime: string;
  store: string;
  skuName: string;
  skuCode: string;
  quantity: number;
  trackingNo?: string;
  remarks?: string;
  createdBy: string;
  inventory_date: string;
  type: 'stock' | 'sample';
  is_sample?: boolean;
  shipmentGroupId?: string | null;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  price?: number;
}

export async function fetchInventoryStatistics(storeId?: string): Promise<InventoryStatisticsResponse> {
  try {
    const params = new URLSearchParams();
    if (storeId && storeId !== 'all') {
      params.append('store_id', storeId);
    }
    const url = `${API_BASE_URL}/inventory/statistics${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);

    // Use fetchWithAuth
    const response = await fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
       const errorText = await response.text().catch(() => `Status: ${response.status}`);
       throw new Error(`API request failed for fetchInventoryStatistics: ${errorText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API: 获取库存统计数据最终失败:', error);
    // Return default error state consistent with original logic
    return {
      sample: { totalQuantity: 0, skuDetails: [] },
      stock: { totalQuantity: 0, skuDetails: [] }
    };
  }
}

export async function fetchInventoryDistribution(storeId?: string): Promise<DistributionItem[]> {
  try {
    const params = new URLSearchParams();
    if (storeId && storeId !== 'all') {
      params.append('store_id', storeId);
    }
    const url = `${API_BASE_URL}/inventory/distribution${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);

    // Use fetchWithAuth
    const response = await fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
       const errorText = await response.text().catch(() => `Status: ${response.status}`);
       throw new Error(`API request failed for fetchInventoryDistribution: ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.error('API: 获取库存分布数据最终失败:', error);
    return [];
  }
}

export async function fetchInventoryRecords(storeId?: string, startDate?: Date, endDate?: Date): Promise<InventoryRecord[]> {
  try {
    const params = new URLSearchParams();
    if (storeId && storeId !== 'all') {
      params.append('store_id', storeId);
    }
    if (startDate) {
      params.append('start_date', formatDateToISOString(startDate));
    }
    if (endDate) {
      params.append('end_date', formatDateToISOString(endDate));
    }

    const url = `${API_BASE_URL}/inventory/records${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);

    // Use fetchWithAuth
    const response = await fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
       const errorText = await response.text().catch(() => `Status: ${response.status}`);
       throw new Error(`API request failed for fetchInventoryRecords: ${errorText}`);
    }
    const data = await response.json();

    // Keep the mapping logic
    return data.map((record: any) => ({
      ...record,
      type: record.is_sample === true ? 'sample' : 'stock',
    }));
  } catch (error) {
    console.error('API: 获取库存记录最终失败:', error);
    return [];
  }
}

export async function addInventoryRecords(records: Omit<InventoryRecord, 'id' | 'createTime' | 'is_sample'>[]): Promise<void> {
  console.log("API: Adding inventory records (frontend format):", records);
  const recordsToSend = records.map(record => {
    const { type, ...rest } = record;
    return {
      ...rest,
      is_sample: type === 'sample'
    };
  });
  console.log("API: Sending inventory records (backend format):", recordsToSend);

  const url = `${API_BASE_URL}/inventory/records`;
  console.log("API: 请求URL:", url);

  // Use fetchWithAuth for POST
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(recordsToSend),
    // Content-Type will be added by fetchWithAuth if needed
  });

  if (!response.ok) {
     const errorText = await response.text().catch(() => `Status: ${response.status}`);
     throw new Error(`API request failed for addInventoryRecords: ${errorText}`);
  }
  // No content expected on success typically
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const url = `${API_BASE_URL}/info/products`;
    console.log("API: 请求URL (fetchProducts):", url);

    const response = await fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
       const errorText = await response.text().catch(() => `Status: ${response.status}`);
       throw new Error(`API request failed for fetchProducts: ${errorText}`);
    }
    
    const data = await response.json(); 
    // Align with the actual fields returned by the API: id, name, code
    const products: Product[] = data.map((p: any) => ({
        id: p.id, // Changed from p.product_id to p.id
        name: p.name, // Changed from p.sku_name to p.name
        code: p.code, // Changed from p.sku_code to p.code
        price: p.price 
    }));
    console.log("API: Fetched Products:", products);
    return products;
  } catch (error) {
    console.error('API: 获取产品数据最终失败:', error);
    return [];
  }
}

export async function updateInventoryRecord(recordId: string, recordData: Partial<Omit<InventoryRecord, 'id' | 'createTime' | 'is_sample'>>): Promise<InventoryRecord> {
  console.log(`API: Updating inventory record ${recordId} (frontend format):`, recordData);
  const { type, ...rest } = recordData;
  const dataToSend: Record<string, any> = { ...rest };
  if (type !== undefined) {
      dataToSend.is_sample = type === 'sample';
  }
  if ('inventory_date' in dataToSend && dataToSend.inventory_date instanceof Date) {
    dataToSend.inventory_date = formatDateToISOString(dataToSend.inventory_date);
  }

  console.log(`API: Sending update for record ${recordId} (backend format):`, dataToSend);

  const url = `${API_BASE_URL}/inventory/records/${recordId}`;
  console.log("API: 请求URL:", url);

  // Use fetchWithAuth for PATCH
  const response = await fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify(dataToSend),
      // Content-Type will be added by fetchWithAuth
  });

  if (!response.ok) {
      const errorBody = await response.text().catch(()=> `Status: ${response.status}`);
      console.error('API Error Body:', errorBody);
      throw new Error(`API request failed updating record ${recordId}: ${errorBody}`);
  }
  const updatedRecord = await response.json();
  // Keep mapping logic
  return {
      ...updatedRecord,
      type: updatedRecord.is_sample === true ? 'sample' : 'stock',
  };
}

export interface SettlementRecord {
  id: string;
  settle_date: string;
  store: string;
  store_id?: number;
  total_amount?: number;
  remarks?: string;
  created_by: string;
  items?: SettlementItem[];
}

export interface SettlementItem {
  item_id: number;
  settlement_id: number;
  product_id: number;
  quantity: number;
  price: number;
  products?: {
    product_id: number;
    sku_name: string;
    sku_code: string;
  }
}

export async function fetchSettlementRecords(storeId?: string, startDate?: Date, endDate?: Date): Promise<SettlementRecord[]> {
  try {
    const params = new URLSearchParams();
    if (storeId && storeId !== 'all') {
      params.append('store_id', storeId);
    }
    if (startDate) {
      params.append('start_date', formatDateToISOString(startDate));
    }
    if (endDate) {
      params.append('end_date', formatDateToISOString(endDate));
    }

    const url = `${API_BASE_URL}/settlement/records${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);

    // Use fetchWithAuth
    const response = await fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
       const errorText = await response.text().catch(() => `Status: ${response.status}`);
       throw new Error(`API request failed for fetchSettlementRecords: ${errorText}`);
    }

    const data = await response.json();

    // Keep the mapping logic
    return data.map((record: any) => ({
      id: `STL-${record.settlement_id}`,
      settle_date: record.settle_date,
      store: record.store,
      store_id: record.store_id, // Ensure backend provides this if needed
      total_amount: record.total_amount,
      remarks: record.remarks,
      created_by: record.created_by,
      items: record.items || []
    }));
  } catch (error) {
    console.error('API: 获取结算记录最终失败:', error);
    return [];
  }
}