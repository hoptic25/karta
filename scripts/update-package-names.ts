import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("=== MENGUBAH NAMA PAKET LANGGANAN DI DATABASE ===");

  const updates = [
    { code: "PARTNER_BASIC", newName: "Mitra Pro" },
    { code: "PARTNER_PROFESSIONAL", newName: "Mitra Plus" },
    { code: "PARTNER_PREMIUM", newName: "Mitra Ultra" },
    { code: "NON_PARTNER_BASIC", newName: "Reguler Pro" },
    { code: "NON_PARTNER_PROFESSIONAL", newName: "Reguler Plus" },
    { code: "NON_PARTNER_PREMIUM", newName: "Reguler Ultra" },
  ];

  for (const item of updates) {
    const updated = await prisma.package.update({
      where: { code: item.code },
      data: { name: item.newName },
    });
    console.log(`✓ ${item.code} diubah namanya menjadi: "${updated.name}"`);
  }

  console.log("\n=== UPDATE NAMA PAKET SELESAI ===");
}

main()
  .catch((err) => {
    console.error("Gagal mengupdate nama paket:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

