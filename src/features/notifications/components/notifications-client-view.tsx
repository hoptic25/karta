"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Clock,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markAsReadAction, markAllAsReadAction } from "../actions";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
}

interface NotificationsClientViewProps {
  initialNotifications: NotificationItem[];
  total: number;
  initialUnreadCount: number;
}

export function NotificationsClientView({
  initialNotifications,
  initialUnreadCount,
}: NotificationsClientViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.readAt;
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    await markAsReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsReadAction();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date() }))
      );
      setUnreadCount(0);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary-brown">
            Pusat Notifikasi
          </h1>
          <p className="text-xs sm:text-sm text-primary-brown/70 mt-1">
            Riwayat pembaruan status pekerjaan, verifikasi berkas, dan aktivitas akun Anda.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-earth-primary" />
            <span>Tandai Semua Dibaca</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-beige pb-3">
        <Filter className="w-4 h-4 text-primary-brown/50" />
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filter === "ALL"
              ? "bg-earth-primary text-white"
              : "text-primary-brown/70 hover:bg-cream"
          }`}
        >
          Semua ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("UNREAD")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            filter === "UNREAD"
              ? "bg-earth-primary text-white"
              : "text-primary-brown/70 hover:bg-cream"
          }`}
        >
          <span>Belum Dibaca</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-white text-primary-brown">
              {unreadCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Notification List */}
      <Card className="border-beige bg-white shadow-xs">
        <CardContent className="p-0 divide-y divide-beige/40">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-cream mx-auto flex items-center justify-center text-primary-brown/40">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-base font-bold text-primary-brown">
                {filter === "UNREAD"
                  ? "Semua notifikasi sudah dibaca"
                  : "Belum ada notifikasi"}
              </h3>
              <p className="text-xs text-primary-brown/60 max-w-sm mx-auto">
                {filter === "UNREAD"
                  ? "Bagus! Anda telah membaca seluruh notifikasi penting mengenai aktivitas Anda."
                  : "Setiap kali ada pekerjaan baru, perubahan status, atau penarikan dana, Anda akan menerima pembaruan di sini."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.readAt;

              return (
                <div
                  key={notif.id}
                  className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    isUnread
                      ? "bg-earth-primary/5 hover:bg-earth-primary/10"
                      : "hover:bg-cream/30"
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isUnread
                          ? "bg-earth-primary text-white shadow-xs"
                          : "bg-cream text-primary-brown/50"
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading text-sm font-bold text-primary-brown">
                          {notif.title}
                        </h4>
                        {isUnread && (
                          <Badge className="bg-earth-sage text-white text-[9px] px-1.5 py-0 uppercase">
                            Baru
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-primary-brown/80 leading-relaxed font-sans">
                        {notif.body}
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] text-primary-brown/50 pt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDateTime(notif.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-xs text-primary-brown/70 hover:text-primary-brown h-8 px-2.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Tandai Dibaca
                      </Button>
                    )}

                    {notif.href && (
                      <Link href={notif.href} onClick={() => handleMarkAsRead(notif.id)}>
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs bg-earth-primary hover:bg-earth-primary/90 text-white flex items-center gap-1 cursor-pointer"
                        >
                          <span>Buka Detail</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
