import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // PRD §4.3 butir 7: lib/ tidak boleh mengimpor dari features/
  {
    files: ["src/lib/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/**", "../features/**"],
              message: "lib/ tidak boleh mengimpor dari features/ (PRD §4.3 butir 7).",
            },
          ],
        },
      ],
    },
  },
  // PRD §4.3 butir 1: app/ tipis, dilarang panggil Prisma langsung
  {
    files: ["src/app/**/*.ts", "src/app/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/db", "@/lib/db.ts"],
              message: "app/ dilarang memanggil Prisma langsung. Gunakan queries.ts atau actions.ts milik fitur (PRD §4.3 butir 1).",
            },
          ],
        },
      ],
    },
  },
  // PRD §4.3 butir 6: Impor antar fitur dilarang langsung ke internal service/queries
  {
    files: ["src/app/**/*.ts", "src/app/**/*.tsx", "src/components/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*service*", "@/features/*/*queries*"],
              message: "Dilarang mengimpor internal module fitur secara langsung. Gunakan export resmi index.ts (PRD §4.3 butir 6).",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
