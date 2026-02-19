import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Papers table for storing academic paper generation records
 */
export const papers = mysqlTable("papers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  type: mysqlEnum("type", ["graduation", "journal", "proposal", "professional"]).notNull(),
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating").notNull(),
  outline: text("outline"),
  content: text("content"),
  wordFileKey: text("wordFileKey"),
  wordFileUrl: text("wordFileUrl"),
  pdfFileKey: text("pdfFileKey"),
  pdfFileUrl: text("pdfFileUrl"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Paper = typeof papers.$inferSelect;
export type InsertPaper = typeof papers.$inferInsert;

/**
 * Paper versions table for storing edit history
 */
export const paperVersions = mysqlTable("paperVersions", {
  id: int("id").autoincrement().primaryKey(),
  paperId: int("paperId").notNull().references(() => papers.id, { onDelete: 'cascade' }),
  versionNumber: int("versionNumber").notNull(),
  outline: text("outline"),
  content: text("content"),
  changeDescription: text("changeDescription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaperVersion = typeof paperVersions.$inferSelect;
export type InsertPaperVersion = typeof paperVersions.$inferInsert;