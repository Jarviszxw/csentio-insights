import { createClient } from '@supabase/supabase-js';

// 首先从环境变量中获取Supabase URL和匿名密钥
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xxaoygsovropzzxigctk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YW95Z3NvdnJvcHp6eGlnY3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NDgwODgsImV4cCI6MjA2MDAyNDA4OH0.Cv2PFtA937un5KD2vPEsYYWCILsBdXKl_Na4kVI5XBg';

// 输出调试信息
console.log('Supabase client initialized with:', {
  supabaseUrl,
  keyProvided: !!supabaseKey,
  env: process.env.NODE_ENV
});

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 