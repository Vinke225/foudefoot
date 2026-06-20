"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function AppAuthSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!searchParams) return;

    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    
    // If we have tokens in URL from the Mobile App WebView
    if (accessToken && refreshToken) {
      const syncSession = async () => {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (data?.session && !error) {
          // Tokens successfully set, we can refresh the page to apply the session
          // and optionally remove tokens from URL so they don't stay visible
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete("access_token");
          currentUrl.searchParams.delete("refresh_token");
          // keep in_app=true
          router.replace(currentUrl.pathname + currentUrl.search);
        }
      };
      
      syncSession();
    }
  }, [searchParams, router, supabase]);

  return null;
}
