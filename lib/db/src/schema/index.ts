import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Single-account table: this app has exactly one "bank account" (no
// multi-user auth), so there is at most one row. The API always operates
// on the first/only row instead of looking one up by a per-browser id.
export const bankAccountsTable = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  // SHA-256 hex digest computed client-side (crypto.subtle.digest), never
  // the plaintext password. Kept consistent with the original client-only
  // implementation so the frontend hashing logic doesn't need to change.
  passwordHash: text("password_hash").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  hourlyRate: integer("hourly_rate").notNull().default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccountsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccountsTable.$inferSelect;