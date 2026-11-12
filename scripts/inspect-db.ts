import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      student: { select: { id: true, username: true, fullName: true } },
      umkm: { select: { id: true, businessName: true } }
    }
  });
  console.log("TOTAL USERS:", users.length);
  for (const u of users) {
    console.log(`- [${u.role}] ${u.email} | Name: ${u.name} | UMKM: ${u.umkm?.businessName || '-'} | Student: ${u.student?.id || '-'}`);
  }

  const roles = await prisma.jobRole.findMany({ select: { id: true, key: true, label: true } });
  console.log("\nROLES:", roles);

  const campuses = await prisma.campus.findMany({ select: { id: true, name: true, city: true } });
  console.log("\nCAMPUSES:", campuses);

  const packages = await prisma.package.findMany({ select: { id: true, code: true, name: true, tier: true, allocationPerJobIdr: true } });
  console.log("\nPACKAGES:", packages);
}

main()
  .catch((e) => {
    console.error("Error inspecting DB:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
