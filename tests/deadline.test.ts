import { describe, it, expect } from "vitest";
import {
  getMinDeadlineHoursSync,
  normalizeTierForDeadline,
  assertValidDeadline,
  isJobClaimableByDeadline,
  getClaimCutoffTime,
  DeadlineError,
} from "../src/features/jobs/deadline";

describe("Job Deadline Rules (PRD §15.2 & BR-J3, BR-J5)", () => {
  describe("normalizeTierForDeadline", () => {
    it("should normalize FREE tier to BASIC (BR-J3)", () => {
      expect(normalizeTierForDeadline("FREE")).toBe("BASIC");
      expect(normalizeTierForDeadline("BASIC")).toBe("BASIC");
      expect(normalizeTierForDeadline("PROFESSIONAL")).toBe("PROFESSIONAL");
      expect(normalizeTierForDeadline("PREMIUM")).toBe("PREMIUM");
    });
  });

  describe("getMinDeadlineHoursSync per role & tier (PRD §15.2)", () => {
    it("should return correct min hours for DATA_ENTRY", () => {
      expect(getMinDeadlineHoursSync("DATA_ENTRY", "BASIC")).toBe(48);
      expect(getMinDeadlineHoursSync("DATA_ENTRY", "FREE")).toBe(48);
      expect(getMinDeadlineHoursSync("DATA_ENTRY", "PROFESSIONAL")).toBe(36);
      expect(getMinDeadlineHoursSync("DATA_ENTRY", "PREMIUM")).toBe(24);
    });

    it("should return correct min hours for CONTENT_WRITER & GRAPHIC_DESIGNER", () => {
      expect(getMinDeadlineHoursSync("CONTENT_WRITER", "BASIC")).toBe(72);
      expect(getMinDeadlineHoursSync("CONTENT_WRITER", "PROFESSIONAL")).toBe(48);
      expect(getMinDeadlineHoursSync("CONTENT_WRITER", "PREMIUM")).toBe(36);

      expect(getMinDeadlineHoursSync("GRAPHIC_DESIGNER", "BASIC")).toBe(72);
      expect(getMinDeadlineHoursSync("GRAPHIC_DESIGNER", "FREE")).toBe(72);
    });

    it("should return correct min hours for VIDEO_EDITOR & UIUX_DESIGNER", () => {
      expect(getMinDeadlineHoursSync("VIDEO_EDITOR", "BASIC")).toBe(120);
      expect(getMinDeadlineHoursSync("VIDEO_EDITOR", "PROFESSIONAL")).toBe(96);
      expect(getMinDeadlineHoursSync("VIDEO_EDITOR", "PREMIUM")).toBe(72);

      expect(getMinDeadlineHoursSync("UIUX_DESIGNER", "BASIC")).toBe(120);
    });

    it("should return correct min hours for FRONTEND_DEV", () => {
      expect(getMinDeadlineHoursSync("FRONTEND_DEV", "BASIC")).toBe(168);
      expect(getMinDeadlineHoursSync("FRONTEND_DEV", "PROFESSIONAL")).toBe(120);
      expect(getMinDeadlineHoursSync("FRONTEND_DEV", "PREMIUM")).toBe(96);
    });
  });

  describe("assertValidDeadline (BR-J3)", () => {
    const baseTime = new Date("2026-11-01T10:00:00Z");

    it("should pass when deadline meets min required hours", async () => {
      // DATA_ENTRY BASIC requires 48 hours
      const validDeadline = new Date(baseTime.getTime() + 49 * 60 * 60 * 1000);
      await expect(
        assertValidDeadline("DATA_ENTRY", "BASIC", validDeadline, baseTime)
      ).resolves.toBe(48);
    });

    it("should reject when deadline is less than min required hours", async () => {
      // DATA_ENTRY BASIC requires 48 hours, providing 47 hours
      const invalidDeadline = new Date(baseTime.getTime() + 47 * 60 * 60 * 1000);
      await expect(
        assertValidDeadline("DATA_ENTRY", "BASIC", invalidDeadline, baseTime)
      ).rejects.toThrow(DeadlineError);
    });

    it("should apply BASIC min hours for FREE package tier", async () => {
      // CONTENT_WRITER FREE tier -> BASIC = 72 hours
      const validDeadline = new Date(baseTime.getTime() + 72 * 60 * 60 * 1000);
      await expect(
        assertValidDeadline("CONTENT_WRITER", "FREE", validDeadline, baseTime)
      ).resolves.toBe(72);

      const invalidDeadline = new Date(baseTime.getTime() + 71 * 60 * 60 * 1000);
      await expect(
        assertValidDeadline("CONTENT_WRITER", "FREE", invalidDeadline, baseTime)
      ).rejects.toThrow(DeadlineError);
    });
  });

  describe("Claim Cutoff & Claimability (BR-J5)", () => {
    it("should calculate correct claim cutoff time", () => {
      // Deadline is at 100 hours from now; role needs 48 hours; cutoff is at 52 hours
      const deadlineAt = new Date("2026-11-10T00:00:00Z");
      const cutoff = getClaimCutoffTime(deadlineAt, "DATA_ENTRY", "BASIC");
      expect(cutoff.getTime()).toBe(deadlineAt.getTime() - 48 * 60 * 60 * 1000);
    });

    it("should allow claim before cutoff, and disallow after cutoff", () => {
      const deadlineAt = new Date("2026-11-10T00:00:00Z");
      const job = {
        deadlineAt,
        jobRoleId: "role-data-entry",
        jobRole: { key: "DATA_ENTRY" },
        packageTier: "BASIC" as const,
      };

      // 49 hours before deadline -> before cutoff -> claimable
      const timeBeforeCutoff = new Date(deadlineAt.getTime() - 49 * 60 * 60 * 1000);
      expect(isJobClaimableByDeadline(job, timeBeforeCutoff)).toBe(true);

      // 47 hours before deadline -> after cutoff -> not claimable
      const timeAfterCutoff = new Date(deadlineAt.getTime() - 47 * 60 * 60 * 1000);
      expect(isJobClaimableByDeadline(job, timeAfterCutoff)).toBe(false);
    });
  });
});

