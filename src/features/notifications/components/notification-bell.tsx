"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ExternalLink, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import {
  fetchNotificationsAction,
  fetchUnreadCountAction,
  markAsReadAction,
  markAllAsReadAction,
} from "../actions";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
}

interface NotificationBellProps {
  viewAllHref: string;
  initialUnreadCount?: number;
}

export function NotificationBell({
  viewAllHref,
  initialUnreadCount = 0,
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll unread count every 30s per PRD §Modul H-1
  useEffect(() => {
    let isMounted = true;

    const checkCount = async () => {
      const res = await fetchUnreadCountAction();
      if (isMounted && res.success) {
        setUnreadCount(res.unreadCount);
      }
    };

    checkCount();
    const timer = setInterval(checkCount, 30_000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleOpenDropdown = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      setIsLoading(true);
      try {
        const res = await fetchNotificationsAction({ limit: 5 });
        if (res.success && res.data) {
          setNotifications(res.data.notifications);
          setUnreadCount(res.data.unreadCount);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMarkAsRead = async (id: string, href?: string | null) => {
    await markAsReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    if (href) {
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsReadAction();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date() }))
    );
    setUnreadCount(0);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleOpenDropdown}
        className="relative p-2 rounded-xl border border-beige bg-white hover:bg-cream text-primary-brown transition-colors focus:outline-hidden focus:ring-2 focus:ring-earth-primary"
        aria-label="Notifikasi"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-beige shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-beige px-4 py-3 bg-cream/40">
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold text-primary-brown">
                Notifikasi
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-earth-sage text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-earth-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai semua dibaca</span>
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-beige/40">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-primary-brown/60">
                Memuat notifikasi...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-primary-brown/60 space-y-1">
                <Bell className="w-6 h-6 mx-auto text-primary-brown/30" />
                <p className="font-medium">Belum ada notifikasi</p>
                <p className="text-[11px] text-primary-brown/50">
                  Aktivitas pekerjaan dan sistem akan muncul di sini.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.readAt;

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors ${isUnread
                        ? "bg-earth-primary/5 hover:bg-earth-primary/10"
                        : "hover:bg-cream/40"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-earth-primary shrink-0" />
                          )}
                          <p className="text-xs font-bold text-primary-brown line-clamp-1">
                            {notif.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-primary-brown/80 mt-1 line-clamp-2 leading-relaxed">
                          {notif.body}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-primary-brown/50 mt-1.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(notif.createdAt)}</span>
                        </div>
                      </div>

                      {notif.href && (
                        <Link
                          href={notif.href}
                          onClick={() => handleMarkAsRead(notif.id, notif.href)}
                          className="shrink-0 p-1.5 text-earth-primary hover:bg-white rounded-lg transition-colors border border-transparent hover:border-beige"
                          title="Buka tautan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-beige p-2.5 bg-cream/20 text-center">
            <Link
              href={viewAllHref}
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-primary-brown hover:text-earth-primary transition-colors block py-1"
            >
              Lihat Semua Notifikasi &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

