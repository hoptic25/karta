import { describe, it, expect } from "vitest";
import {
  canTransition,
  validateTransition,
  StateMachineError,
  isTerminalStatus,
} from "../src/features/jobs/state-machine";
import type { JobStatus, Role } from "../src/generated/prisma/client";

describe("Job State Machine (PRD §7)", () => {
  describe("Legal transitions", () => {
    const legalCases: { from: JobStatus; to: JobStatus; actor: Role | "SYSTEM" }[] = [
      { from: "DRAFT", to: "OPEN", actor: "UMKM" },
      { from: "OPEN", to: "CLAIMED", actor: "STUDENT" },
      { from: "OPEN", to: "CANCELLED", actor: "UMKM" },
      { from: "OPEN", to: "CANCELLED", actor: "ADMIN" },
      { from: "OPEN", to: "EXPIRED", actor: "SYSTEM" },
      { from: "CLAIMED", to: "IN_PROGRESS", actor: "STUDENT" },
      { from: "CLAIMED", to: "OPEN", actor: "STUDENT" },
      { from: "CLAIMED", to: "OPEN", actor: "SYSTEM" },
      { from: "CLAIMED", to: "CANCELLED", actor: "UMKM" },
      { from: "CLAIMED", to: "CANCELLED", actor: "ADMIN" },
      { from: "IN_PROGRESS", to: "SUBMITTED", actor: "STUDENT" },
      { from: "IN_PROGRESS", to: "OPEN", actor: "ADMIN" },
      { from: "IN_PROGRESS", to: "CANCELLED", actor: "ADMIN" },
      { from: "REVISION_REQUESTED", to: "SUBMITTED", actor: "STUDENT" },
      { from: "REVISION_REQUESTED", to: "OPEN", actor: "ADMIN" },
      { from: "REVISION_REQUESTED", to: "CANCELLED", actor: "ADMIN" },
      { from: "SUBMITTED", to: "ACCEPTED", actor: "UMKM" },
      { from: "SUBMITTED", to: "ACCEPTED", actor: "SYSTEM" },
      { from: "SUBMITTED", to: "REVISION_REQUESTED", actor: "UMKM" },
      { from: "SUBMITTED", to: "REJECTED", actor: "UMKM" },
      { from: "SUBMITTED", to: "CANCELLED", actor: "ADMIN" },
      { from: "REJECTED", to: "DISPUTED", actor: "STUDENT" },
      { from: "REJECTED", to: "CANCELLED", actor: "ADMIN" },
      { from: "DISPUTED", to: "ACCEPTED", actor: "ADMIN" },
      { from: "DISPUTED", to: "REJECTED", actor: "ADMIN" },
      { from: "DISPUTED", to: "CANCELLED", actor: "ADMIN" },
    ];

    legalCases.forEach(({ from, to, actor }) => {
      it(`should allow ${from} -> ${to} by ${actor}`, () => {
        expect(canTransition(from, to, actor)).toBe(true);
        expect(() => validateTransition(from, to, actor)).not.toThrow();
      });
    });
  });

  describe("Illegal transitions and actor permissions", () => {
    it("should reject student publishing a draft", () => {
      expect(canTransition("DRAFT", "OPEN", "STUDENT")).toBe(false);
      expect(() => validateTransition("DRAFT", "OPEN", "STUDENT")).toThrow(StateMachineError);
    });

    it("should reject UMKM taking/claiming an open job", () => {
      expect(canTransition("OPEN", "CLAIMED", "UMKM")).toBe(false);
      expect(() => validateTransition("OPEN", "CLAIMED", "UMKM")).toThrow(StateMachineError);
    });

    it("should reject direct jump from DRAFT to ACCEPTED", () => {
      expect(canTransition("DRAFT", "ACCEPTED", "UMKM")).toBe(false);
      expect(() => validateTransition("DRAFT", "ACCEPTED", "UMKM")).toThrow(StateMachineError);
    });

    it("should reject transitions from terminal state ACCEPTED", () => {
      expect(isTerminalStatus("ACCEPTED")).toBe(true);
      expect(canTransition("ACCEPTED", "OPEN", "UMKM")).toBe(false);
      expect(() => validateTransition("ACCEPTED", "OPEN", "UMKM")).toThrow(StateMachineError);
    });

    it("should reject transitions from terminal state CANCELLED", () => {
      expect(isTerminalStatus("CANCELLED")).toBe(true);
      expect(canTransition("CANCELLED", "OPEN", "UMKM")).toBe(false);
      expect(() => validateTransition("CANCELLED", "OPEN", "UMKM")).toThrow(StateMachineError);
    });

    it("should reject transitions from terminal state EXPIRED", () => {
      expect(isTerminalStatus("EXPIRED")).toBe(true);
      expect(canTransition("EXPIRED", "OPEN", "SYSTEM")).toBe(false);
      expect(() => validateTransition("EXPIRED", "OPEN", "SYSTEM")).toThrow(StateMachineError);
    });

    it("should reject UMKM directly marking IN_PROGRESS as ACCEPTED without submission", () => {
      expect(canTransition("IN_PROGRESS", "ACCEPTED", "UMKM")).toBe(false);
      expect(() => validateTransition("IN_PROGRESS", "ACCEPTED", "UMKM")).toThrow(StateMachineError);
    });
  });
});

