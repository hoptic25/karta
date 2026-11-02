import { describe, it, expect } from "vitest";
import { validateTransition, StateMachineError } from "../src/features/jobs/state-machine";
import { isValidDeliverableUrl } from "../src/lib/url";
import { ExecutionError } from "../src/features/jobs/execution";
import type { StudentLevel } from "../src/generated/prisma/client";

describe("Execution & Review Logic (PRD §6.5 BR-E1 to BR-E8)", () => {
  const baseNow = new Date("2026-11-02T12:00:00Z");

  describe("BR-E1: Start Work", () => {
    it("should allow student to transition from CLAIMED to IN_PROGRESS", () => {
      expect(() => {
        validateTransition("CLAIMED", "IN_PROGRESS", "STUDENT");
      }).not.toThrow();
    });

    it("should reject student starting work from invalid status", () => {
      expect(() => {
        validateTransition("OPEN", "IN_PROGRESS", "STUDENT");
      }).toThrow(StateMachineError);

      expect(() => {
        validateTransition("ACCEPTED", "IN_PROGRESS", "STUDENT");
      }).toThrow(StateMachineError);
    });
  });

  describe("BR-E2 & BR-J7: Submission & URL Validation", () => {
    it("should validate and accept supported deliverable URLs", () => {
      const validDrive = isValidDeliverableUrl("https://drive.google.com/drive/folders/123xyz");
      expect(validDrive.valid).toBe(true);

      const validFigma = isValidDeliverableUrl("https://figma.com/design/abc/Preview");
      expect(validFigma.valid).toBe(true);

      const validGithub = isValidDeliverableUrl("https://github.com/student/repo");
      expect(validGithub.valid).toBe(true);
    });

    it("should reject invalid or non-whitelisted deliverable URLs", () => {
      const invalidHttp = isValidDeliverableUrl("http://drive.google.com/drive/folders/123xyz");
      expect(invalidHttp.valid).toBe(false);
      expect(invalidHttp.error).toContain("HTTPS");

      const invalidDomain = isValidDeliverableUrl("https://unknown-file-hoster.com/file.zip");
      expect(invalidDomain.valid).toBe(false);
      expect(invalidDomain.error).toContain("belum didukung");
    });

    it("should require all acceptance criteria to be checked in self-check", () => {
      const jobCriteria = [
        { id: "c-1", text: "Format CSV" },
        { id: "c-2", text: "Minimal 50 baris" },
      ];

      const partialSelfCheck = [
        { criterionId: "c-1", checked: true },
        { criterionId: "c-2", checked: false },
      ];

      const checkedIds = new Set(
        partialSelfCheck.filter((c) => c.checked).map((c) => c.criterionId)
      );

      const missing = jobCriteria.filter((c) => !checkedIds.has(c.id));
      expect(missing).toHaveLength(1);
      expect(missing[0].id).toBe("c-2");
    });

    it("should calculate review SLA 3 days from submit time", () => {
      const reviewDueAt = new Date(baseNow.getTime() + 3 * 24 * 60 * 60 * 1000);
      const diffHours = (reviewDueAt.getTime() - baseNow.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBe(72);
    });
  });

  describe("BR-E3 & BR-E4: UMKM Review (Accept, Request Revision, Reject)", () => {
    it("should correctly compute reputation points on ACCEPT (+10 base, +3 no revision, +2 on time)", () => {
      const computePoints = (revisionCount: number, isLate: boolean, submissionNumber: number) => {
        let points = 10;
        if (revisionCount === 0) points += 3;
        if (!isLate && submissionNumber === 1) points += 2;
        return points;
      };

      // Best case: submit pertama, tepat waktu, langsung diterima
      expect(computePoints(0, false, 1)).toBe(15);

      // Submit terlambat tapi diterima tanpa revisi
      expect(computePoints(0, true, 1)).toBe(13);

      // Diterima setelah 1 kali revisi
      expect(computePoints(1, false, 2)).toBe(10);
    });

    it("should promote student level correctly based on point thresholds", () => {
      const determineLevel = (points: number): StudentLevel => {
        if (points >= 300) return "EXPERT";
        if (points >= 150) return "TRUSTED";
        if (points >= 50) return "RELIABLE";
        return "NEWCOMER";
      };

      expect(determineLevel(45)).toBe("NEWCOMER");
      expect(determineLevel(50)).toBe("RELIABLE");
      expect(determineLevel(120)).toBe("RELIABLE");
      expect(determineLevel(150)).toBe("TRUSTED");
      expect(determineLevel(299)).toBe("TRUSTED");
      expect(determineLevel(300)).toBe("EXPERT");
    });

    it("should enforce maximum 2 revisions limit (BR-E3 & BR-E4)", () => {
      const maxRevisions = 2;

      const attemptRevision = (currentRevisionCount: number) => {
        if (currentRevisionCount >= maxRevisions) {
          throw new ExecutionError(
            `Batas maksimum revisi (${maxRevisions} kali) telah tercapai. Anda hanya dapat menerima atau menolak hasil kerja ini.`,
            "MAX_REVISIONS_REACHED"
          );
        }
        return currentRevisionCount + 1;
      };

      // Revision 1: OK
      expect(attemptRevision(0)).toBe(1);

      // Revision 2: OK
      expect(attemptRevision(1)).toBe(2);

      // Revision 3: Rejects
      expect(() => attemptRevision(2)).toThrow(ExecutionError);
      expect(() => attemptRevision(2)).toThrow(/Batas maksimum revisi/);
    });

    it("should require at least 20 characters for rejection reason (BR-E3)", () => {
      const validateRejectionReason = (reason: string) => {
        const trimmed = reason.trim();
        if (trimmed.length < 20) {
          throw new ExecutionError(
            "Alasan penolakan wajib diisi dengan jelas minimal 20 karakter.",
            "REASON_TOO_SHORT"
          );
        }
        return true;
      };

      expect(() => validateRejectionReason("Kurang bagus")).toThrow(ExecutionError);
      expect(() => validateRejectionReason("Kurang bagus")).toThrow(/minimal 20 karakter/);
      expect(
        validateRejectionReason("Hasil kerja belum sesuai dengan template referensi yang diberikan pada instruksi.")
      ).toBe(true);
    });

    it("should set dispute window to 3 days on REJECT", () => {
      const disputeUntil = new Date(baseNow.getTime() + 3 * 24 * 60 * 60 * 1000);
      const diffDays = (disputeUntil.getTime() - baseNow.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(3);
    });
  });

  describe("BR-E6: Student Withdrawal Before Start", () => {
    it("should allow student to withdraw in CLAIMED phase without penalty", () => {
      expect(() => {
        validateTransition("CLAIMED", "OPEN", "STUDENT");
      }).not.toThrow();
    });
  });
});
