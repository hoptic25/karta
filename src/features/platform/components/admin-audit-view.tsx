"use client";

import { useState } from "react";
import {
  FileText,
  Filter,
  User as UserIcon,
  Clock,
  Shield,
  Search,
  Code,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { getAuditLogs } from "../audit";

interface AdminAuditViewProps {
  initialData: Awaited<ReturnType<typeof getAuditLogs>>;
}

export function AdminAuditView({ initialData }: AdminAuditViewProps) {
  const [logs] = useState(initialData.logs);
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (selectedEntity !== "ALL" && log.entity !== selectedEntity) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchEntity = log.entity.toLowerCase().includes(q);
      const matchActor =
        log.actor?.name?.toLowerCase().includes(q) ||
        log.actor?.email?.toLowerCase().includes(q);
      const matchEntityId = log.entityId.toLowerCase().includes(q);
      return matchAction || matchEntity || matchActor || matchEntityId;
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary-brown text-white text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold">
            Audit Trail 🧾
          </Badge>
          <span className="text-xs text-primary-brown/60">
            {initialData.total} Catatan Total
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-primary-brown mt-2">
          Jejak Audit Sistem (Audit Log)
        </h1>
        <p className="text-sm text-primary-brown/70 mt-1 max-w-3xl">
          Rekaman mutasi penting dan keputusan administratif di KARTA untuk kepatuhan,
          keamanan, dan transparansi tata kelola data.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-2xl border border-beige shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-brown/50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aksi, entitas, ID, atau nama aktor..."
            className="pl-9 bg-cream/30 border-beige text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-brown/50 shrink-0" />
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="h-9 px-3 text-xs bg-cream/30 border border-beige rounded-md text-primary-brown focus:outline-hidden focus:ring-1 focus:ring-earth-primary"
          >
            <option value="ALL">Semua Entitas</option>
            {initialData.distinctEntities.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="border-beige bg-white shadow-xs">
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <FileText className="w-8 h-8 mx-auto text-primary-brown/30" />
              <p className="font-heading text-base font-bold text-primary-brown">
                Tidak ada catatan audit yang cocok
              </p>
              <p className="text-xs text-primary-brown/50">
                Ubah filter atau kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-beige bg-cream/30 text-primary-brown/70 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Aksi</th>
                    <th className="py-3 px-4">Entitas & ID</th>
                    <th className="py-3 px-4">Aktor</th>
                    <th className="py-3 px-4 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/40">
                  {filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-cream/20 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-primary-brown/70">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary-brown/40" />
                            <span>{formatDateTime(log.createdAt)}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className="bg-cream text-primary-brown font-mono text-[10px] font-bold border border-beige"
                          >
                            {log.action}
                          </Badge>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-primary-brown">
                            {log.entity}
                          </div>
                          <div className="text-[10px] font-mono text-primary-brown/50 truncate max-w-[140px]">
                            {log.entityId}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {log.actor ? (
                            <div>
                              <div className="font-medium text-primary-brown flex items-center gap-1">
                                <UserIcon className="w-3 h-3 text-earth-primary" />
                                <span>{log.actor.name || "Admin"}</span>
                              </div>
                              <div className="text-[10px] text-primary-brown/50">
                                {log.actor.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-primary-brown/50 italic flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              <span>Sistem / Otomasi</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => toggleExpand(log.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-earth-primary hover:underline cursor-pointer"
                          >
                            <Code className="w-3 h-3" />
                            <span>Metadata</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 text-left bg-primary-brown text-white p-3 rounded-xl font-mono text-[10px] overflow-x-auto max-w-sm ml-auto">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(log.meta, null, 2) || "{}"}
                              </pre>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
