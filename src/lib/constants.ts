/**
 * KARTA Design System Tokens & Domain Constants
 * Synchronized with design_system.md & karta_prd.md
 */

export const THEME_COLORS = {
  primaryBrown: "#5a4639",
  sageGreen: "#a3b18a",
  beige: "#c9b9a7",
  cream: "#f7f4ed",
  peach: "#f4d7c7",
} as const;

export const JOB_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draf",
  OPEN: "Terbuka",
  CLAIMED: "Diklaim",
  IN_PROGRESS: "Sedang Dikerjakan",
  SUBMITTED: "Menunggu Review",
  REVISION_REQUESTED: "Revisi Diminta",
  ACCEPTED: "Selesai Diterima",
  REJECTED: "Ditolak",
  DISPUTED: "Dalam Sengketa",
  CANCELLED: "Dibatalkan",
  EXPIRED: "Kedaluwarsa",
};

export const JOB_ROLE_LABELS: Record<string, string> = {
  DATA_ENTRY: "Data Entry",
  CONTENT_WRITER: "Content Writer",
  GRAPHIC_DESIGNER: "Graphic Designer",
  VIDEO_EDITOR: "Video Editor",
  SOCIAL_MEDIA: "Social Media Specialist",
  FRONTEND_DEV: "Frontend Developer",
  UIUX_DESIGNER: "UI/UX Designer",
};

export const STUDENT_LEVEL_LABELS: Record<string, string> = {
  NEWCOMER: "Newcomer",
  RELIABLE: "Reliable",
  TRUSTED: "Trusted",
  EXPERT: "Expert",
};

export const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  DRIVE: "Google Drive",
  DOCS: "Google Docs / Sheets",
  FIGMA: "Figma Link",
  GITHUB: "GitHub Repository",
  CANVA: "Canva Design",
  NOTION: "Notion Page",
  OTHER: "Tautan Eksternal Lainnya",
};
