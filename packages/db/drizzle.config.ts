import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const apiEnvPath = path.resolve(packageDir, "../../apps/api/.env");
if (existsSync(apiEnvPath)) {
  process.loadEnvFile(apiEnvPath);
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set to your PostgreSQL or Supabase connection URI.",
  );
}

export default defineConfig({
  schema: path.join(packageDir, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
