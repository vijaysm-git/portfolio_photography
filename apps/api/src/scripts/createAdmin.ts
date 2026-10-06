import { randomUUID } from "node:crypto";
import { db, pool, adminAccountsTable } from "@workspace/db";
import argon2 from "argon2";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const emailResult = z.string().email().safeParse(process.env.ADMIN_EMAIL?.trim());
const password = process.env.ADMIN_PASSWORD;
const operation = process.argv[2] ?? "create";

if (
  !emailResult.success ||
  !password ||
  password.length < 12 ||
  !["create", "reset"].includes(operation)
) {
  throw new Error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD in apps/api/.env and choose create or reset. Passwords must be at least 12 characters.",
  );
}

try {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(64382912014001)`);
    const existing = await tx.select().from(adminAccountsTable).limit(2);
    if (operation === "create") {
      if (existing.length > 0) {
        throw new Error(
          "An admin account already exists. Use the authenticated account settings to change credentials.",
        );
      }
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
      });
      await tx.insert(adminAccountsTable).values({
        id: randomUUID(),
        email: emailResult.data.toLowerCase(),
        passwordHash,
      });
    } else {
      if (existing.length !== 1) {
        throw new Error(
          "Reset requires exactly one admin account. Check the database before continuing.",
        );
      }
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
      });
      await tx
        .update(adminAccountsTable)
        .set({
          email: emailResult.data.toLowerCase(),
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(adminAccountsTable.id, existing[0].id));
      await tx.execute(sql`DELETE FROM sessions`);
    }
  });
  console.info(operation === "create" ? "Initial admin account created." : "Admin account reset; all sessions were revoked.");
} finally {
  await pool.end();
}
