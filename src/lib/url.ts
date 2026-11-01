/**
 * URL validation helper according to BR-J7:
 * - Must be https://
 * - Host in whitelist
 * - Length <= 2048
 * - No credentials (user/password) in URL
 * - Rejects javascript:, data:, http:, etc.
 */

export const ALLOWED_HOSTS = [
  "drive.google.com",
  "docs.google.com",
  "figma.com",
  "github.com",
  "canva.com",
  "notion.so",
  "notion.site",
  "youtube.com",
  "youtu.be",
  "behance.net",
  "dribbble.com",
] as const;

export function isValidDeliverableUrl(urlString: string, customWhitelist?: string[]): { valid: boolean; error?: string } {
  if (!urlString || typeof urlString !== "string") {
    return { valid: false, error: "Tautan tidak boleh kosong" };
  }

  const trimmed = urlString.trim();

  if (trimmed.length > 2048) {
    return { valid: false, error: "Tautan melebihi batas 2048 karakter" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Format URL tidak valid" };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Tautan harus menggunakan protokol HTTPS aman (https://)" };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: "Tautan tidak boleh memuat kredensial pengguna" };
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowed = customWhitelist && customWhitelist.length > 0 ? customWhitelist : (ALLOWED_HOSTS as readonly string[]);

  const isAllowedHost = allowed.some((host) => {
    const lowerHost = host.toLowerCase();
    return hostname === lowerHost || hostname.endsWith(`.${lowerHost}`);
  });

  if (!isAllowedHost) {
    return {
      valid: false,
      error: `Domain '${hostname}' belum didukung. Gunakan salah satu layanan: Google Drive, Docs, Figma, GitHub, Canva, Notion, YouTube, Behance, atau Dribbble.`,
    };
  }

  return { valid: true };
}
