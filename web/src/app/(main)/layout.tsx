import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { createClient } from "@/utils/supabase/server";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  let unreadCount = 0;
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    unreadCount = count || 0;
  }

  return (
    <RealtimeProvider initialUnreadCount={unreadCount} userId={user?.id}>
      <div className="flex justify-center w-full min-h-screen bg-white overflow-x-hidden pb-20 lg:pb-0">
        
        {/* Left Sidebar - Hidden on small screens, fixed or flex on large */}
        <div className="hidden lg:flex shrink-0">
          <LeftSidebar profile={profile} />
        </div>
        
        <div className="flex flex-col flex-1 w-full max-w-7xl min-w-0">
          <TopHeader profile={profile} />
          
          <div className="flex flex-1 justify-center lg:justify-between px-4 sm:px-6 lg:px-8 pt-6 gap-6">
            
            {/* Main Content Area - Flexible width */}
            <main className="flex-1 max-w-3xl min-w-0 w-full">
              {children}
            </main>
            
            {/* Right Sidebar - Hidden on medium/small screens */}
            <div className="hidden xl:block shrink-0">
              <RightSidebar />
            </div>
            
          </div>
        </div>
        
        {/* Mobile Navigation Bar */}
        <MobileNavBar />
        
      </div>
    </RealtimeProvider>
  );
}
