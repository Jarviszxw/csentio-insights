import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 这个函数可以在任何需要检查身份验证的请求之前运行
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // 使用 Supabase Auth Helpers 创建 Supabase 客户端
  const supabase = createMiddlewareClient({ req, res })

  // 获取当前会话信息
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register';

  // 如果用户未登录且尝试访问受保护的路径 (非登录/注册页)
  if (!session && !isAuthPage && req.nextUrl.pathname.startsWith('/')) { // Protecting all routes except auth pages
     // Only redirect non-auth pages. Allow access to '/' if it's public
     if (req.nextUrl.pathname !== '/') {
         const redirectUrl = req.nextUrl.clone()
         redirectUrl.pathname = '/login'
         // Optional: Pass the original path to redirect back after login
         redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname)
         return NextResponse.redirect(redirectUrl)
     }
  }

  // 如果用户已登录且尝试访问登录或注册页面
  if (session && isAuthPage) {
      // 重定向到主面板页面
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
  }

  return res
}

// 配置中间件适用的路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以以下开头的路径：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - BW-1.png, BW-2.png, logo.svg (image files in public)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|WW-1.png|BW-2.png|logo.svg).*)',
    // 添加需要保护的特定路径，例如 '/dashboard/:path*'
    // '/dashboard/:path*', // 保护 dashboard 及其所有子路径
  ],
} 