import type { JobStatus, Role } from "@/generated/prisma/client";

export class StateMachineError extends Error {
  code: string;
  fromStatus: JobStatus;
  toStatus: JobStatus;
  actor: Role | "SYSTEM";

  constructor(
    message: string,
    fromStatus: JobStatus,
    toStatus: JobStatus,
    actor: Role | "SYSTEM",
    code = "ILLEGAL_STATE_TRANSITION"
  ) {
    super(message);
    this.name = "StateMachineError";
    this.code = code;
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
    this.actor = actor;
  }
}

export interface TransitionRule {
  from: JobStatus;
  to: JobStatus;
  allowedActors: (Role | "SYSTEM")[];
  description: string;
}

/**
 * Tabel Legal State Transitions berdasarkan PRD §7:
 *
 * | Dari → Ke | Aktor | Pemicu | Efek samping |
 * |---|---|---|---|
 * | DRAFT → OPEN | UMKM | Publish | Validasi BR-J1/J3/S7; kuota −1; snapshot uang |
 * | OPEN → CLAIMED | Mahasiswa | Take Job | Assignment ACTIVE; ledger RESERVED |
 * | OPEN → CANCELLED | UMKM, ADMIN | Batalkan | Kuota +1 |
 * | OPEN → EXPIRED | Sistem | Lewat batas klaim | Kuota +1 |
 * | CLAIMED → IN_PROGRESS | Mahasiswa | Mulai | startedAt |
 * | CLAIMED → OPEN | Mahasiswa, Sistem | Mundur / auto-release | Assignment WITHDRAWN; ledger VOIDED |
 * | CLAIMED → CANCELLED | UMKM, ADMIN | Batalkan sebelum mulai | Kuota +1; ledger VOIDED; assignment WITHDRAWN |
 * | IN_PROGRESS → SUBMITTED | Mahasiswa | Submit | Submission baru; reviewDueAt |
 * | REVISION_REQUESTED → SUBMITTED | Mahasiswa | Submit ulang | Submission baru; reviewDueAt |
 * | SUBMITTED → ACCEPTED | UMKM, Sistem | Accept / SLA lewat | Ledger PAYABLE; poin; assignment COMPLETED |
 * | SUBMITTED → REVISION_REQUESTED | UMKM | Request Revision | revisionCount++; revisionDueAt |
 * | SUBMITTED → REJECTED | UMKM | Reject | Ledger HELD; disputeUntil |
 * | REJECTED → DISPUTED | Mahasiswa | Ajukan sengketa | Dispute OPEN |
 * | DISPUTED → ACCEPTED | Admin | ACCEPT_WORK | Seperti Accept |
 * | DISPUTED → REJECTED | Admin | UPHOLD_REJECTION | Ledger VOIDED; rejectionFinalAt |
 * | REJECTED (final) → REJECTED | Sistem | disputeUntil lewat | Ledger VOIDED; rejectionFinalAt |
 * | IN_PROGRESS/REVISION_REQUESTED → OPEN | Admin | FailureReport CONFIRMED | Assignment FAILED; −15 poin; ledger VOIDED |
 * | (aktif) → CANCELLED | Admin | Moderasi | Ledger VOIDED; kuota +1 bila restoreQuota |
 */
export const LEGAL_TRANSITIONS: TransitionRule[] = [
  // DRAFT -> OPEN
  {
    from: "DRAFT",
    to: "OPEN",
    allowedActors: ["UMKM"],
    description: "UMKM mempublikasikan draf pekerjaan",
  },
  // OPEN transitions
  {
    from: "OPEN",
    to: "CLAIMED",
    allowedActors: ["STUDENT"],
    description: "Mahasiswa mengklaim pekerjaan (Take Job)",
  },
  {
    from: "OPEN",
    to: "CANCELLED",
    allowedActors: ["UMKM", "ADMIN"],
    description: "Pekerjaan dibatalkan saat masih buka",
  },
  {
    from: "OPEN",
    to: "EXPIRED",
    allowedActors: ["SYSTEM"],
    description: "Pekerjaan kedaluwarsa melewati batas klaim",
  },
  // CLAIMED transitions
  {
    from: "CLAIMED",
    to: "IN_PROGRESS",
    allowedActors: ["STUDENT"],
    description: "Mahasiswa mulai mengerjakan tugas",
  },
  {
    from: "CLAIMED",
    to: "OPEN",
    allowedActors: ["STUDENT", "SYSTEM"],
    description: "Mahasiswa mundur sebelum mulai atau auto-release 24 jam",
  },
  {
    from: "CLAIMED",
    to: "CANCELLED",
    allowedActors: ["UMKM", "ADMIN"],
    description: "UMKM membatalkan sebelum mahasiswa mulai mengerjakan",
  },
  // IN_PROGRESS transitions
  {
    from: "IN_PROGRESS",
    to: "SUBMITTED",
    allowedActors: ["STUDENT"],
    description: "Mahasiswa mengumpulkan hasil kerja",
  },
  {
    from: "IN_PROGRESS",
    to: "OPEN",
    allowedActors: ["ADMIN"],
    description: "Admin konfirmasi kegagalan mahasiswa dan mengembalikan job ke OPEN",
  },
  {
    from: "IN_PROGRESS",
    to: "CANCELLED",
    allowedActors: ["ADMIN"],
    description: "Admin membatalkan pekerjaan melalui moderasi",
  },
  // REVISION_REQUESTED transitions
  {
    from: "REVISION_REQUESTED",
    to: "SUBMITTED",
    allowedActors: ["STUDENT"],
    description: "Mahasiswa mengumpulkan revisi hasil kerja",
  },
  {
    from: "REVISION_REQUESTED",
    to: "OPEN",
    allowedActors: ["ADMIN"],
    description: "Admin konfirmasi kegagalan mahasiswa dan mengembalikan job ke OPEN",
  },
  {
    from: "REVISION_REQUESTED",
    to: "CANCELLED",
    allowedActors: ["ADMIN"],
    description: "Admin membatalkan pekerjaan melalui moderasi",
  },
  // SUBMITTED transitions
  {
    from: "SUBMITTED",
    to: "ACCEPTED",
    allowedActors: ["UMKM", "SYSTEM"],
    description: "UMKM menerima hasil kerja atau auto-accept SLA 3 hari",
  },
  {
    from: "SUBMITTED",
    to: "REVISION_REQUESTED",
    allowedActors: ["UMKM"],
    description: "UMKM meminta revisi hasil kerja",
  },
  {
    from: "SUBMITTED",
    to: "REJECTED",
    allowedActors: ["UMKM"],
    description: "UMKM menolak hasil kerja",
  },
  {
    from: "SUBMITTED",
    to: "CANCELLED",
    allowedActors: ["ADMIN"],
    description: "Admin membatalkan pekerjaan melalui moderasi",
  },
  // REJECTED transitions
  {
    from: "REJECTED",
    to: "DISPUTED",
    allowedActors: ["STUDENT"],
    description: "Mahasiswa mengajukan sengketa sebelum jendela dispute berakhir",
  },
  {
    from: "REJECTED",
    to: "CANCELLED",
    allowedActors: ["ADMIN"],
    description: "Admin membatalkan pekerjaan melalui moderasi",
  },
  // DISPUTED transitions
  {
    from: "DISPUTED",
    to: "ACCEPTED",
    allowedActors: ["ADMIN"],
    description: "Admin menyelesaikan sengketa dengan menerima hasil kerja (ACCEPT_WORK)",
  },
  {
    from: "DISPUTED",
    to: "REJECTED",
    allowedActors: ["ADMIN"],
    description: "Admin menyelesaikan sengketa dengan mengukuhkan penolakan (UPHOLD_REJECTION)",
  },
  {
    from: "DISPUTED",
    to: "CANCELLED",
    allowedActors: ["ADMIN"],
    description: "Admin membatalkan pekerjaan melalui moderasi",
  },
];

export const TERMINAL_STATUSES: readonly JobStatus[] = [
  "ACCEPTED",
  "CANCELLED",
  "EXPIRED",
] as const;

export function isTerminalStatus(status: JobStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Validasi apakah transisi dari status awal ke status tujuan diizinkan untuk aktor tersebut.
 */
export function canTransition(
  fromStatus: JobStatus,
  toStatus: JobStatus,
  actor: Role | "SYSTEM"
): boolean {
  if (fromStatus === toStatus) return false;

  return LEGAL_TRANSITIONS.some(
    (rule) =>
      rule.from === fromStatus &&
      rule.to === toStatus &&
      rule.allowedActors.includes(actor)
  );
}

/**
 * Menjalankan transisi status pekerjaan.
 * Melempar StateMachineError bila transisi ilegal atau aktor tidak berhak.
 */
export function validateTransition(
  fromStatus: JobStatus,
  toStatus: JobStatus,
  actor: Role | "SYSTEM"
): void {
  if (isTerminalStatus(fromStatus)) {
    throw new StateMachineError(
      `Pekerjaan sudah berada di status terminal ${fromStatus} dan tidak dapat diubah lagi.`,
      fromStatus,
      toStatus,
      actor,
      "TERMINAL_STATUS_ERROR"
    );
  }

  const match = LEGAL_TRANSITIONS.find(
    (rule) => rule.from === fromStatus && rule.to === toStatus
  );

  if (!match) {
    throw new StateMachineError(
      `Transisi status pekerjaan dari ${fromStatus} ke ${toStatus} tidak diizinkan.`,
      fromStatus,
      toStatus,
      actor,
      "ILLEGAL_TRANSITION"
    );
  }

  if (!match.allowedActors.includes(actor)) {
    throw new StateMachineError(
      `Aktor ${actor} tidak memiliki izin untuk mengubah status pekerjaan dari ${fromStatus} ke ${toStatus}.`,
      fromStatus,
      toStatus,
      actor,
      "FORBIDDEN_TRANSITION_ACTOR"
    );
  }
}

export function getAvailableTransitions(
  fromStatus: JobStatus,
  actor: Role | "SYSTEM"
): JobStatus[] {
  return LEGAL_TRANSITIONS.filter(
    (rule) => rule.from === fromStatus && rule.allowedActors.includes(actor)
  ).map((rule) => rule.to);
}

