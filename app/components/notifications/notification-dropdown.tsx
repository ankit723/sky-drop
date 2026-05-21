"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Package, Cpu, AlertTriangle, PartyPopper, Info } from "lucide-react";

type Notification = {
  id: string; title: string; message: string; type: string; read: boolean; createdAt: string;
};

const typeIcons: Record<string, React.ReactNode> = {
  DELIVERY_APPROVED: <Package className="w-4 h-4 text-blue-500" />,
  DRONE_ASSIGNED: <Cpu className="w-4 h-4 text-indigo-500" />,
  DELIVERY_FAILED: <AlertTriangle className="w-4 h-4 text-red-500" />,
  PACKAGE_DELIVERED: <PartyPopper className="w-4 h-4 text-green-500" />,
  GENERAL: <Info className="w-4 h-4 text-muted-light" />,
};

export default function NotificationDropdown({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(initialCount);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function loadNotifications() {
    if (loaded) return;
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
      setLoaded(true);
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    setUnread(0);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    setUnread(u => Math.max(0, u - 1));
  }

  function toggle() {
    setOpen(!open);
    if (!open) loadNotifications();
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground w-full"
      >
        <Bell className="w-4 h-4 text-muted-light" />
        Notifications
        {unread > 0 && (
          <span className="ml-auto bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-xl shadow-xl border border-border-light overflow-hidden z-50 animate-fade-in">
          <div className="p-3 border-b border-border-light flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary font-medium hover:text-primary-dark flex items-center gap-1">
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border-light">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted">No notifications yet</div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 flex gap-3 hover:bg-surface-hover/50 cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                onClick={() => !n.read && markRead(n.id)}
              >
                <div className="mt-0.5">{typeIcons[n.type] || typeIcons.GENERAL}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                    {!n.read && <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-light mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <button className="p-1 hover:bg-primary/10 rounded-lg self-start flex-shrink-0" title="Mark as read">
                    <Check className="w-3 h-3 text-primary" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
