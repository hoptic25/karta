import { format } from "date-fns";
import { id } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";

export const JAKARTA_TZ = "Asia/Jakarta";

/**
 * Format IDR currency without decimals: e.g. "Rp 25.000"
 */
export function formatRupiah(amount: number): string {
  const rounded = Math.floor(amount || 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(rounded)
    .replace(/\s+/g, " ");
}

/**
 * Format date in Asia/Jakarta timezone, e.g. "31 Okt 2026, 14:00 WIB"
 */
export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const tzDate = new TZDate(d, JAKARTA_TZ);
  return `${format(tzDate, "d MMM yyyy, HH:mm", { locale: id })} WIB`;
}

/**
 * Format date only in Asia/Jakarta timezone, e.g. "31 Oktober 2026"
 */
export function formatDateOnly(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const tzDate = new TZDate(d, JAKARTA_TZ);
  return format(tzDate, "d MMMM yyyy", { locale: id });
}

/**
 * Mask bank account number according to BR-W2: "•••• 1234"
 */
export function maskBankAccount(accountNumber?: string | null): string {
  if (!accountNumber) return "-";
  const clean = accountNumber.trim();
  if (clean.length <= 4) return clean;
  const lastFour = clean.slice(-4);
  return `•••• ${lastFour}`;
}
