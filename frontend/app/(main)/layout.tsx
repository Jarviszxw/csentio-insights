import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header' // Assuming SiteHeader is also needed in layout
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

// Define User type (can be imported or defined here)
type User = { name?: string | null; email: string; avatar?: string | null };

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Prepare user data for NavUser / AppSidebar
  const navUserData: User | null = authUser ? {
      email: authUser.email!,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
      avatar: authUser.user_metadata?.avatar_url || null
  } : null;

  // Redirect logic should primarily be handled by middleware,
  // but you could add a server-side check here too if necessary.
  // For example: if (!navUserData) { redirect('/login'); }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 55)",
          "--header-height": "calc(var(--spacing) * 10)",
        } as React.CSSProperties
      }
    >
      {/* Render AppSidebar here with user data */}
      <AppSidebar variant="inset" user={navUserData} />
      <SidebarInset>
        {/* Render SiteHeader here */}
        <SiteHeader />
        {/* Render the actual page content (page.tsx) */}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
} 