import "server-only";

import { prisma } from "@/lib/db";

export interface AuditLogFilter {
  entity?: string;
  action?: string;
  actorId?: string;
  take?: number;
  skip?: number;
}

export async function getAuditLogs(filter: AuditLogFilter = {}) {
  const { entity, action, actorId, take = 50, skip = 0 } = filter;

  const where: Record<string, unknown> = {};
  if (entity && entity !== "ALL") where.entity = entity;
  if (action && action !== "ALL") where.action = action;
  if (actorId) where.actorId = actorId;

  const [logs, total, entitiesGrouped] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ["entity"],
      _count: { entity: true },
    }),
  ]);

  const distinctEntities = entitiesGrouped.map((e) => e.entity).sort();

  return {
    logs,
    total,
    distinctEntities,
  };
}

export async function createAuditLog(params: {
  actorId?: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: Record<string, unknown>;
}) {
  return await prisma.auditLog.create({
    data: {
      actorId: params.actorId || null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      meta: (params.meta as object) || null,
    },
  });
}

