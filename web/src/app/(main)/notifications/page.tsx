import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ResetUnreadCount } from "@/components/notifications/ResetUnreadCount";

export const revalidate = 0;

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Marquer toutes les notifications comme lues
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col h-full pb-10">
      <ResetUnreadCount />
      {/* Header Tabs inside Center Column */}
      <div className="flex items-center gap-8 border-b border-border/40 px-6 pt-2 mb-6">
        <button className="pb-3 border-b-[3px] border-primary font-bold text-[15px] text-black">Toutes</button>
        <button className="pb-3 border-b-[3px] border-transparent text-muted-foreground font-semibold text-[15px] hover:text-black transition-colors">Mentions</button>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-black text-black tracking-tight">Notifications</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {(!notifications || notifications.length === 0) ? (
              <div className="p-10 text-center text-gray-500">
                Vous n&apos;avez aucune notification pour le moment.
              </div>
            ) : (
              notifications.map((notification) => {
                let Icon = Bell;
                let iconColor = "text-gray-500 fill-gray-500";
                const bgColor = notification.read ? "hover:bg-gray-50/50" : "bg-primary/5 hover:bg-primary/10";

                if (notification.type === 'like') {
                  Icon = Heart;
                  iconColor = "text-red-500 fill-red-500";
                } else if (notification.type === 'comment') {
                  Icon = MessageCircle;
                  iconColor = "text-primary fill-primary";
                } else if (notification.type === 'follow') {
                  Icon = UserPlus;
                  iconColor = "text-blue-500 fill-blue-500";
                }

                return (
                  <div key={notification.id} className={`p-6 flex gap-4 transition-colors cursor-pointer ${bgColor}`}>
                    <div className="pt-1">
                      <Icon className={`w-8 h-8 ${iconColor}`} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-[15px] text-gray-800">
                        {notification.content}
                      </p>
                      <p className="text-[12px] text-gray-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="h-32"></div>
        </div>
      </ScrollArea>
    </div>
  );
}
