import { DateRange } from "react-day-picker";

// API 基础 URL
const API_BASE_URL = 'http://localhost:8000/api';

export interface GMVResponse {
  total_gmv: number;
  mom_percentage: number;
  trend: 'up' | 'down';
}

/**
 * 格式化日期为ISO格式的日期字符串 (YYYY-MM-DD)，避免时区问题
 */
function formatDateToISOString(date: Date): string {
  // 使用直接构建字符串的方式，避免时区转换问题
  const year = date.getFullYear();
  // getMonth()返回0-11，需要+1
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取总 GMV 的函数
 * @param dateRange 可选的日期范围
 * @returns 返回GMV数据对象
 */
export async function fetchTotalGMV(dateRange?: DateRange): Promise<GMVResponse> {
  try {
    console.log("API: 开始获取GMV数据，原始日期范围:", dateRange);
    
    // 构建查询参数
    const params = new URLSearchParams();
    
    if (dateRange?.from) {
      // 直接处理月份的第一天
      const year = dateRange.from.getFullYear();
      const month = dateRange.from.getMonth(); // 0-11
      const firstDayOfMonth = new Date(year, month, 1);
      
      // 格式化为YYYY-MM-DD
      const formattedFromDate = formatDateToISOString(firstDayOfMonth);
      
      params.append('start_date', formattedFromDate);
      console.log("API: 使用月初日期:", formattedFromDate, "原始日期对象:", dateRange.from);
    }
    
    if (dateRange?.to) {
      // 直接计算月份的最后一天
      const year = dateRange.to.getFullYear();
      const month = dateRange.to.getMonth(); // 0-11
      // 下个月的第0天就是当前月的最后一天
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      // 格式化为YYYY-MM-DD
      const formattedToDate = formatDateToISOString(lastDayOfMonth);
      
      params.append('end_date', formattedToDate);
      console.log("API: 使用月末日期:", formattedToDate, "原始日期对象:", dateRange.to);
    }
    
    // 构建完整 URL
    const url = `${API_BASE_URL}/metrics/total-gmv${params.toString() ? '?' + params.toString() : ''}`;
    console.log("API: 请求URL:", url);
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    // 发送请求
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
    console.log("API: 获取到GMV数据:", data);
    return data;
  } catch (error) {
    console.error('API: 获取GMV数据失败:', error);
    // 返回默认值
    return {
      total_gmv: 0, // 默认值设为0更合理
      mom_percentage: 12.5,
      trend: 'up'
    };
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