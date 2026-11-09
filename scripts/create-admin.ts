/**
 * Script untuk membuat user admin
 * Usage: pnpm admin:create <email> <password> <name>
 * Example: pnpm admin:create admin@karta.id admin123 "Admin Karta"
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

// Setup connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Setup Prisma dengan adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createAdmin() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error("❌ Usage: pnpm admin:create <email> <password> <name>");
    console.error('   Example: pnpm admin:create admin@karta.id admin123 "Admin Karta"');
    process.exit(1);
  }

  const [email, password, name] = args;

  if (password.length < 6) {
    console.error("❌ Password harus minimal 6 karakter");
    process.exit(1);
  }

  try {
    // Cek apakah email sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      // Update ke admin jika sudah ada
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.update({
        where: { email: email.toLowerCase().trim() },
        data: {
          role: "ADMIN",
          password: hashedPassword,
          name,
        },
      });

      console.log("\n✅ User existing berhasil di-update menjadi ADMIN");
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Nama: ${name}`);
      console.log(`🔑 Password: ${password}`);
      console.log("\n🚀 Silakan login di: http://localhost:3000/login");
    } else {
      // Buat user admin baru
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const admin = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name,
          role: "ADMIN",
          status: "ACTIVE",
          isCampusEmail: email.endsWith(".ac.id"),
        },
      });

      console.log("\n✅ Admin berhasil dibuat!");
      console.log(`📧 Email: ${admin.email}`);
      console.log(`👤 Nama: ${admin.name}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`🆔 ID: ${admin.id}`);
      console.log("\n🚀 Silakan login di: http://localhost:3000/login");
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createAdmin();
