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
  inventory: InventoryStats;
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
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching inventory statistics:', error);
    return { sample: { totalQuantity: 0, skuDetails: [] }, inventory: { totalQuantity: 0, skuDetails: [] } };
  }
}

export async function fetchInventoryDistribution(storeId?: string): Promise<DistributionItem[]> {
  try {
    const params = new URLSearchParams();
    if (storeId && storeId !== 'all') {
      params.append('store_id', storeId);
    }
    const url = `${API_BASE_URL}/inventory/distribution${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching inventory distribution:', error);
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
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching inventory records:', error);
    return [];
  }
}

export async function addInventoryRecords(records: Omit<InventoryRecord, 'id' | 'createTime'>[]): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(records),
    });
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
  } catch (error) {
    console.error('Error adding inventory records:', error);
    throw error;
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/info/products`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}