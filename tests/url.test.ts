import { describe, it, expect } from "vitest";
import { isValidDeliverableUrl } from "../src/lib/url";
import { formatRupiah, maskBankAccount } from "../src/lib/format";

describe("URL Whitelist & Deliverable Validation (BR-J7)", () => {
  it("accepts valid google drive links", () => {
    const res = isValidDeliverableUrl("https://drive.google.com/file/d/12345/view");
    expect(res.valid).toBe(true);
  });

  it("accepts valid figma and github links", () => {
    expect(isValidDeliverableUrl("https://figma.com/file/abcdef/Design").valid).toBe(true);
    expect(isValidDeliverableUrl("https://github.com/myuser/myrepo").valid).toBe(true);
  });

  it("accepts valid notion and canva links", () => {
    expect(isValidDeliverableUrl("https://notion.site/my-page-123").valid).toBe(true);
    expect(isValidDeliverableUrl("https://canva.com/design/DAE123").valid).toBe(true);
  });

  it("rejects non-https protocol", () => {
    const res = isValidDeliverableUrl("http://drive.google.com/file/d/12345");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("HTTPS");
  });

  it("rejects dangerous pseudo-protocols like javascript: or data:", () => {
    expect(isValidDeliverableUrl("javascript:alert(1)").valid).toBe(false);
    expect(isValidDeliverableUrl("data:text/html;base64,PHNjcmlwdD4=").valid).toBe(false);
  });

  it("rejects domains outside whitelist", () => {
    const res = isValidDeliverableUrl("https://malicious-site.com/file");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("belum didukung");
  });

  it("rejects credentials in url", () => {
    const res = isValidDeliverableUrl("https://user:password@github.com/myrepo");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("kredensial");
  });

  it("rejects empty or excessively long URLs", () => {
    expect(isValidDeliverableUrl("").valid).toBe(false);
    const longUrl = "https://github.com/" + "a".repeat(2050);
    expect(isValidDeliverableUrl(longUrl).valid).toBe(false);
  });
});

describe("Format Helpers", () => {
  it("formats rupiah without decimals", () => {
    expect(formatRupiah(25000)).toMatch(/Rp\s*25\.000/);
    expect(formatRupiah(0)).toMatch(/Rp\s*0/);
  });

  it("masks bank account properly (BR-W2)", () => {
    expect(maskBankAccount("1234567890")).toBe("•••• 7890");
    expect(maskBankAccount("1234")).toBe("1234");
    expect(maskBankAccount(null)).toBe("-");
  });
});
