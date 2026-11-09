import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nPassword:", password);
console.log("Hash:", hash);
console.log("\nCopy hash ini dan paste ke field 'password' di Prisma Studio\n");
