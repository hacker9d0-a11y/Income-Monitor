import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, bankAccountsTable } from "@workspace/db";

const router: IRouter = Router();

const setupSchema = z.object({
  passwordHash: z.string().min(1),
});

const loginSchema = z.object({
  passwordHash: z.string().min(1),
});

function serialize(account: typeof bankAccountsTable.$inferSelect) {
  return {
    startTime: account.startTime.toISOString(),
    hourlyRate: account.hourlyRate,
  };
}

// Returns the (only) account, or 404 if setup hasn't happened yet.
router.get("/bank/account", async (_req, res) => {
  const [account] = await db.select().from(bankAccountsTable).limit(1);

  if (!account) {
    res.status(404).json({ message: "No account has been set up yet" });
    return;
  }

  res.json(serialize(account));
});

// Creates the account the first time. Fails if one already exists.
router.post("/bank/account/setup", async (req, res) => {
  const parsed = setupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const [existing] = await db.select().from(bankAccountsTable).limit(1);
  if (existing) {
    res.status(409).json({ message: "Account already exists" });
    return;
  }

  const [account] = await db
    .insert(bankAccountsTable)
    .values({
      passwordHash: parsed.data.passwordHash,
      startTime: new Date(),
      hourlyRate: 100,
    })
    .returning();

  res.status(201).json(serialize(account));
});

// Validates a login attempt against the stored hash.
router.post("/bank/account/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const [account] = await db.select().from(bankAccountsTable).limit(1);
  if (!account) {
    res.status(404).json({ message: "No account has been set up yet" });
    return;
  }

  if (account.passwordHash !== parsed.data.passwordHash) {
    res.status(401).json({ message: "Invalid password" });
    return;
  }

  res.json(serialize(account));
});

export default router;
