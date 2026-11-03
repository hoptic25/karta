import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../src/lib/db";
import { getAuditLogs, createAuditLog } from "../src/features/platform/audit";

vi.mock("../src/lib/db", () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("Audit Log System (PRD §Modul G-12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAuditLogs", () => {
    it("should fetch audit logs with filter and entities list", async () => {
      const mockLogs = [
        {
          id: "log-1",
          actorId: "admin-1",
          action: "DISPUTE_RESOLVED_ACCEPT",
          entity: "DISPUTE",
          entityId: "disp-1",
          meta: { decision: "ACCEPT_WORK" },
          createdAt: new Date(),
          actor: {
            id: "admin-1",
            name: "Super Admin",
            email: "admin@karta.id",
            role: "ADMIN",
          },
        },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as never);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(1);
      vi.mocked(prisma.auditLog.groupBy).mockResolvedValue([
        { entity: "DISPUTE", _count: { entity: 1 } },
        { entity: "SUBSCRIPTION", _count: { entity: 3 } },
      ] as never);

      const res = await getAuditLogs({ entity: "DISPUTE" });

      expect(res.logs).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.distinctEntities).toEqual(["DISPUTE", "SUBSCRIPTION"]);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entity: "DISPUTE" },
        })
      );
    });
  });

  describe("createAuditLog", () => {
    it("should write audit log entry to database", async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({
        id: "log-created",
        actorId: "admin-1",
        action: "PACKAGE_EDIT",
        entity: "PACKAGE",
        entityId: "pkg-1",
        meta: { price: 90000 },
        createdAt: new Date(),
      } as never);

      const res = await createAuditLog({
        actorId: "admin-1",
        action: "PACKAGE_EDIT",
        entity: "PACKAGE",
        entityId: "pkg-1",
        meta: { price: 90000 },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: "admin-1",
          action: "PACKAGE_EDIT",
          entity: "PACKAGE",
          entityId: "pkg-1",
          meta: { price: 90000 },
        },
      });
      expect(res.id).toBe("log-created");
    });
  });
});

