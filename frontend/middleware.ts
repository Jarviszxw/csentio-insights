import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 这个函数可以在任何需要检查身份验证的请求之前运行
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // 使用 Supabase Auth Helpers 创建 Supabase 客户端
  const supabase = createMiddlewareClient({ req, res })

  // 尝试获取/刷新会话信息 (New way)
  const { data: { user } } = await supabase.auth.getUser();
  const session = user ? (await supabase.auth.getSession()).data.session : null; // 确保获取 session 对象

  const isAuthPage = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register';
  const isRootPage = req.nextUrl.pathname === '/';

  // 如果用户未登录
  if (!session) {
    // 如果访问的不是认证页面 (登录/注册)
    if (!isAuthPage) {
       // 重定向到登录页，并附带原始路径信息
       const redirectUrl = req.nextUrl.clone()
       redirectUrl.pathname = '/login'
       // 如果原始访问的是根路径以外的路径，则记录下来以便登录后跳回
       if (!isRootPage) {
           redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname)
       }
       return NextResponse.redirect(redirectUrl)
    }
    // 如果访问的是认证页面，则允许访问
    return res;
  }

  // 如果用户已登录
  if (session) {
    // 如果尝试访问认证页面或根页面，重定向到 dashboard
    if (isAuthPage || isRootPage) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

// 配置中间件适用的路径
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files in /public folder with common image extensions or specific names
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Explanation of the new regex:
    // (?!...) Negative lookahead: asserts that the following pattern does not match
    // api|_next/static|_next/image|favicon.ico : Excludes these specific paths
    // |.*\\.(?:svg|png|jpg|jpeg|gif|webp)$ : Excludes any path ending with common image extensions.
    //   .* : Matches any characters
    //   \\. : Matches a literal dot
    //   (?:...) : Non-capturing group for extensions
    //   svg|png|... : Matches common image extensions
    //   $ : Matches the end of the string

    // If you prefer explicit file names instead of extension matching:
    // '/((?!api|_next/static|_next/image|favicon.ico|WW-1.png|BW-1.png|BW-2.png|logo.svg|CAMPAIGN_9.jpg).*)',
  ],
} 