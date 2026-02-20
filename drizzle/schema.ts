import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

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
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }), // Stripe customer ID
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }), // Active subscription ID
  subscriptionStatus: mysqlEnum("subscriptionStatus", [
    "none",
    "active",
    "canceled",
    "past_due",
  ]).default("none"),
  subscriptionEndDate: timestamp("subscriptionEndDate"),
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
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: mysqlEnum("type", [
    "graduation",
    "journal",
    "proposal",
    "professional",
  ]).notNull(),
  status: mysqlEnum("status", ["generating", "completed", "failed"])
    .default("generating")
    .notNull(),
  outline: text("outline"),
  content: text("content"),
  wordFileKey: text("wordFileKey"),
  wordFileUrl: text("wordFileUrl"),
  pdfFileKey: text("pdfFileKey"),
  pdfFileUrl: text("pdfFileUrl"),
  errorMessage: text("errorMessage"),
  folderId: int("folderId"),
  isDeleted: int("isDeleted").default(0).notNull(), // 0 = active, 1 = in recycle bin
  deletedAt: timestamp("deletedAt"),
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
  paperId: int("paperId")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }),
  versionNumber: int("versionNumber").notNull(),
  outline: text("outline"),
  content: text("content"),
  changeDescription: text("changeDescription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaperVersion = typeof paperVersions.$inferSelect;
export type InsertPaperVersion = typeof paperVersions.$inferInsert;

/**
 * References table for storing paper references/citations
 */
export const references = mysqlTable("references", {
  id: int("id").autoincrement().primaryKey(),
  paperId: int("paperId")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  authors: text("authors").notNull(), // JSON array of author names
  year: int("year"),
  journal: text("journal"),
  volume: varchar("volume", { length: 50 }),
  issue: varchar("issue", { length: 50 }),
  pages: varchar("pages", { length: 50 }),
  doi: varchar("doi", { length: 255 }),
  url: text("url"),
  documentType: mysqlEnum("documentType", [
    "journal",
    "book",
    "thesis",
    "conference",
    "report",
    "standard",
    "patent",
    "web",
  ])
    .default("journal")
    .notNull(),
  citationFormat: mysqlEnum("citationFormat", [
    "gbt7714",
    "apa",
    "mla",
    "chicago",
  ])
    .default("gbt7714")
    .notNull(),
  formattedCitation: text("formattedCitation"), // Pre-formatted citation string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reference = typeof references.$inferSelect;
export type InsertReference = typeof references.$inferInsert;

/**
 * Quality checks table for storing paper quality assessment results
 */
export const qualityChecks = mysqlTable("qualityChecks", {
  id: int("id").autoincrement().primaryKey(),
  paperId: int("paperId")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }),
  overallScore: int("overallScore").notNull(), // 0-100
  plagiarismScore: int("plagiarismScore"), // 0-100, higher means more plagiarism
  grammarScore: int("grammarScore"), // 0-100
  academicStyleScore: int("academicStyleScore"), // 0-100
  structureScore: int("structureScore"), // 0-100
  issues: text("issues"), // JSON array of detected issues
  suggestions: text("suggestions"), // JSON array of improvement suggestions
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QualityCheck = typeof qualityChecks.$inferSelect;
export type InsertQualityCheck = typeof qualityChecks.$inferInsert;

/**
 * Polish history table for storing AI text polishing records
 */
export const polishHistory = mysqlTable("polishHistory", {
  id: int("id").autoincrement().primaryKey(),
  paperId: int("paperId")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }),
  originalText: text("originalText").notNull(),
  polishedText: text("polishedText").notNull(),
  polishType: mysqlEnum("polishType", [
    "expression",
    "grammar",
    "academic",
    "comprehensive",
  ]).notNull(),
  suggestions: text("suggestions"), // JSON array of alternative suggestions
  applied: int("applied").default(0).notNull(), // 0 = not applied, 1 = applied
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PolishHistory = typeof polishHistory.$inferSelect;
export type InsertPolishHistory = typeof polishHistory.$inferInsert;

/**
 * Knowledge documents table for RAG support (uploaded PDFs/literature)
 */
export const knowledgeDocuments = mysqlTable("knowledgeDocuments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  paperId: int("paperId").references(() => papers.id, { onDelete: "cascade" }),
  fileName: text("fileName").notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  extractedText: text("extractedText"),
  summary: text("summary"),
  metadata: text("metadata"), // JSON: { pageCount, authors, title, abstract, keywords }
  status: mysqlEnum("status", ["uploading", "processing", "ready", "failed"])
    .default("uploading")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;

/**
 * Charts table for storing generated chart configurations
 */
export const charts = mysqlTable("charts", {
  id: int("id").autoincrement().primaryKey(),
  paperId: int("paperId")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  chartType: mysqlEnum("chartType", [
    "line",
    "bar",
    "scatter",
    "pie",
    "radar",
    "area",
  ]).notNull(),
  dataSource: text("dataSource").notNull(), // JSON: raw data array
  chartConfig: text("chartConfig").notNull(), // JSON: recharts config
  description: text("description"),
  figureNumber: int("figureNumber"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Chart = typeof charts.$inferSelect;
export type InsertChart = typeof charts.$inferInsert;

/**
 * Folders table for project/file management
 */
export const folders = mysqlTable("folders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  parentId: int("parentId"),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

/**
 * Paper tags table for tagging papers
 */
export const paperTags = mysqlTable("paperTags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaperTag = typeof paperTags.$inferSelect;
export type InsertPaperTag = typeof paperTags.$inferInsert;

/**
 * Paper-tag associations
 */
export const paperTagAssociations = mysqlTable("paperTagAssociations", {
  id: int("id").autoincrement().primaryKey(),
  paperId: int("paperId")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }),
  tagId: int("tagId")
    .notNull()
    .references(() => paperTags.id, { onDelete: "cascade" }),
});

export type PaperTagAssociation = typeof paperTagAssociations.$inferSelect;
export type InsertPaperTagAssociation =
  typeof paperTagAssociations.$inferInsert;

/**
 * Translation history table
 */
export const translations = mysqlTable("translations", {
  id: int("id").autoincrement().primaryKey(),
  paperId: int("paperId").references(() => papers.id, { onDelete: "cascade" }),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sourceText: text("sourceText").notNull(),
  translatedText: text("translatedText").notNull(),
  sourceLang: varchar("sourceLang", { length: 10 }).notNull(),
  targetLang: varchar("targetLang", { length: 10 }).notNull(),
  domain: varchar("domain", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = typeof translations.$inferInsert;
