import supabase from './supabase';

/**
 * 用户凭据接口
 */
interface UserCredentials {
  email: string;
  password: string;
}

/**
 * 认证响应接口
 */
interface AuthResponse {
  user_id?: string;
  email?: string;
  access_token?: string;
  token_type?: string;
  message?: string;
}

// 测试模式标志
const TEST_MODE = process.env.NODE_ENV === 'development';

/**
 * 用户注册
 * @param credentials - 用户凭据
 */
export async function registerUser(credentials: UserCredentials): Promise<AuthResponse> {
  try {
    const { email, password } = credentials;
    
    // 测试模式特殊处理
    if (TEST_MODE && email === 'test@example.com') {
      console.log('[测试模式] 模拟注册成功');
      return {
        user_id: 'test-user-id',
        email: email,
        message: "测试注册成功。这是模拟成功的响应。"
      };
    }
    
    console.log('调用Supabase auth.signUp...');
    // 直接使用Supabase客户端
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('Supabase注册错误:', error);
      throw new Error(error.message);
    }
    
    console.log('Supabase注册响应:', data);
    return {
      user_id: data.user?.id,
      email: data.user?.email,
      message: "注册成功。请检查您的邮箱确认账户。"
    };
  } catch (error) {
    console.error('注册错误:', error);
    throw error;
  }
}

/**
 * 用户登录
 * @param credentials - 用户凭据
 */
export async function loginUser(credentials: UserCredentials): Promise<AuthResponse> {
  try {
    const { email, password } = credentials;
    
    // 测试模式特殊处理
    if (TEST_MODE && email === 'test@example.com' && password === 'password') {
      console.log('[测试模式] 模拟登录成功');
      return {
        user_id: 'test-user-id',
        email: email,
        access_token: 'test-token-' + Date.now(),
        token_type: "bearer"
      };
    }
    
    console.log('调用Supabase auth.signInWithPassword...');
    // 直接使用Supabase客户端
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Supabase登录错误:', error);
      throw new Error(error.message);
    }
    
    console.log('Supabase登录响应:', data);
    return {
      user_id: data.user?.id,
      email: data.user?.email,
      access_token: data.session?.access_token,
      token_type: "bearer"
    };
  } catch (error) {
    console.error('登录错误:', error);
    throw error;
  }
}

/**
 * 退出登录
 */
export async function logoutUser(): Promise<void> {
  try {
    // 测试模式特殊处理
    if (TEST_MODE && localStorage.getItem('auth_token') === 'test-token') {
      console.log('[测试模式] 模拟退出登录');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_id');
      return;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    
    // 清除本地存储
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
  } catch (error) {
    console.error('退出登录错误:', error);
    throw error;
  }
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser() {
  try {
    // 测试模式特殊处理
    if (TEST_MODE && localStorage.getItem('auth_token')?.startsWith('test-token')) {
      console.log('[测试模式] 返回测试用户');
      return {
        id: 'test-user-id',
        email: localStorage.getItem('user_email') || 'test@example.com',
        role: 'authenticated',
      };
    }
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('获取用户错误:', error);
      throw new Error(error.message);
    }
    
    return data.user;
  } catch (error) {
    console.error('获取用户错误:', error);
    return null;
  }
} 