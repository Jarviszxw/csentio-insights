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
  // return date.toISOString().split('T')[0]; // 可能受时区影响

  // 手动构建 YYYY-MM-DD 格式，避免时区转换问题
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始，需要+1
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1); // 月初
  const end = new Date(year, month + 1, 0); // 月末
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: GMVResponse = await response.json();
    console.log("API: 获取到GMV数据:", data);
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('API: 获取GMV数据失败: Request timed out');
    } else {
      console.error('API: 获取GMV数据失败:', error);
    }
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
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
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('API: 获取总销售额数据失败: Request timed out');
    } else {
      console.error('API: 获取总销售额数据失败:', error);
    }
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
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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


/**
 * 获取所有店铺数据
 * @returns 店铺数据数组
 */
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

// ... existing imports and code ...

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
  id: string;
  name: string;
  code: string;
}

export async function fetchInventoryStatistics(storeId?: string): Promise<InventoryStatisticsResponse> {
  try {
    const params = new URLSearchParams();
    if (storeId && storeId !== 'all') {
      params.append('store_id', storeId);
    }
    const url = `${API_BASE_URL}/inventory/statistics${params.toString() ? '?' + params.toString() : ''}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal // 关联 AbortController
    });

    clearTimeout(timeoutId); // 清除超时

    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Error fetching inventory statistics: Request timed out');
    } else {
      console.error('Error fetching inventory statistics:', error);
    }
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal // 关联 AbortController
    });

    clearTimeout(timeoutId); // 清除超时

    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Error fetching inventory distribution: Request timed out');
    } else {
      console.error('Error fetching inventory distribution:', error);
    }
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal // 关联 AbortController
    });

    clearTimeout(timeoutId); // 清除超时

    if (!response.ok) throw new Error(`API request failed fetching records: ${response.status}`);
    const data = await response.json();

    return data.map((record: any) => ({
      ...record,
      type: record.is_sample === true ? 'sample' : 'stock',
    }));
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Error fetching inventory records: Request timed out');
    } else {
      console.error('Error fetching inventory records:', error);
    }
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
  const response = await fetch(`${API_BASE_URL}/inventory/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(recordsToSend),
  });
  if (!response.ok) throw new Error(`API request failed adding records: ${response.status}`);
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    const response = await fetch(`${API_BASE_URL}/info/products`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal // 关联 AbortController
    });

    clearTimeout(timeoutId); // 清除超时

    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Error fetching products: Request timed out');
    } else {
      console.error('Error fetching products:', error);
    }
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
  if (dataToSend.inventory_date instanceof Date) {
    dataToSend.inventory_date = formatDateToISOString(dataToSend.inventory_date);
  }

  console.log(`API: Sending update for record ${recordId} (backend format):`, dataToSend);
  const response = await fetch(`${API_BASE_URL}/inventory/records/${recordId}`, {
      method: 'PATCH',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
      },
      body: JSON.stringify(dataToSend),
  });

  if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error Body:', errorBody);
      throw new Error(`API request failed updating record ${recordId}: ${response.status}`);
  }
  const updatedRecord = await response.json();
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`API request failed fetching records: ${response.status}`);
    
    const data = await response.json();
    
    // 格式化返回的数据，确保字段符合前端期望
    return data.map((record: any) => ({
      id: `STL-${record.settlement_id}`,
      settle_date: record.settle_date,
      store: record.store,
      store_id: record.store_id,
      total_amount: record.total_amount,
      remarks: record.remarks,
      created_by: record.created_by,
      items: record.items || []
    }));
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Error fetching settlement records: Request timed out');
    } else {
      console.error('Error fetching settlement records:', error);
    }
    return [];
  }
}