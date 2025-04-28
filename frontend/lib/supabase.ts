import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

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

// 创建Supabase客户端 (使用 Pages Browser Client)
const supabase = createPagesBrowserClient({ supabaseUrl, supabaseKey }); // Pass options object

console.log('Supabase pages browser client created successfully.');

export default supabase; 