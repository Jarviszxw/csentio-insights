import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 输出调试信息
console.log('Supabase client initializing...', {
  urlProvided: !!supabaseUrl,
  keyProvided: !!supabaseKey,
  env: process.env.NODE_ENV
});

// 检查环境变量是否存在
if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// 创建Supabase客户端 (此时可以确定 supabaseUrl 和 supabaseKey 都是 string)
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client created successfully.');

export default supabase; 