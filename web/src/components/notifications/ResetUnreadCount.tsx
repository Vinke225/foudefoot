"use client";

import { useEffect } from "react";
import { useRealtime } from "@/components/providers/RealtimeProvider";

export function ResetUnreadCount() {
  const { setUnreadCount } = useRealtime();

  useEffect(() => {
    // Reset unread count to 0 when this component is mounted
    setUnreadCount(0);
  }, [setUnreadCount]);

  return null;
}
