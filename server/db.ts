import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertPaper, InsertUser, papers, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Paper queries
export async function createPaper(paper: InsertPaper) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(papers).values(paper);
  return result[0].insertId;
}

export async function getPaperById(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.select().from(papers).where(eq(papers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPapersByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return db.select().from(papers).where(eq(papers.userId, userId)).orderBy(desc(papers.createdAt));
}

export async function updatePaper(id: number, updates: Partial<InsertPaper>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.update(papers).set(updates).where(eq(papers.id, id));
}

export async function deletePaper(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.delete(papers).where(eq(papers.id, id));
}
