import { and, desc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertPaper, InsertPaperVersion, InsertUser, paperVersions, papers, users, references, InsertReference, qualityChecks, InsertQualityCheck, knowledgeDocuments, InsertKnowledgeDocument, charts, InsertChart, folders, InsertFolder, paperTags, InsertPaperTag, paperTagAssociations, InsertPaperTagAssociation, translations, InsertTranslation } from "../drizzle/schema";
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

export async function getPapersByUserId(userId: number, includeDeleted = false) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  if (includeDeleted) {
    return db.select().from(papers).where(eq(papers.userId, userId)).orderBy(desc(papers.createdAt));
  }
  return db.select().from(papers).where(and(eq(papers.userId, userId), eq(papers.isDeleted, 0))).orderBy(desc(papers.createdAt));
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

// Paper version queries
export async function createPaperVersion(version: InsertPaperVersion) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(paperVersions).values(version);
  return result[0].insertId;
}

export async function getPaperVersionsByPaperId(paperId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return db.select().from(paperVersions).where(eq(paperVersions.paperId, paperId)).orderBy(desc(paperVersions.versionNumber));
}

export async function getPaperVersionById(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.select().from(paperVersions).where(eq(paperVersions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLatestVersionNumber(paperId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.select().from(paperVersions).where(eq(paperVersions.paperId, paperId)).orderBy(desc(paperVersions.versionNumber)).limit(1);
  return result.length > 0 ? result[0].versionNumber : 0;
}

// Reference functions
export async function createReference(reference: InsertReference) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(references).values(reference);
  return result[0].insertId;
}

export async function getReferencesByPaperId(paperId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(references).where(eq(references.paperId, paperId));
}

export async function deleteReference(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(references).where(eq(references.id, id));
}

export async function updateReference(id: number, data: Partial<InsertReference>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(references).set(data).where(eq(references.id, id));
}

// Quality check functions
export async function createQualityCheck(check: InsertQualityCheck) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(qualityChecks).values(check);
  return result[0].insertId;
}

export async function getQualityChecksByPaperId(paperId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(qualityChecks).where(eq(qualityChecks.paperId, paperId)).orderBy(desc(qualityChecks.createdAt));
}

export async function getLatestQualityCheck(paperId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(qualityChecks).where(eq(qualityChecks.paperId, paperId)).orderBy(desc(qualityChecks.createdAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Knowledge document functions
export async function createKnowledgeDocument(doc: InsertKnowledgeDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(knowledgeDocuments).values(doc);
  return result[0].insertId;
}

export async function getKnowledgeDocumentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getKnowledgeDocumentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.userId, userId)).orderBy(desc(knowledgeDocuments.createdAt));
}

export async function getKnowledgeDocumentsByPaperId(paperId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.paperId, paperId)).orderBy(desc(knowledgeDocuments.createdAt));
}

export async function updateKnowledgeDocument(id: number, updates: Partial<InsertKnowledgeDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(knowledgeDocuments).set(updates).where(eq(knowledgeDocuments.id, id));
}

export async function deleteKnowledgeDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
}

// Chart functions
export async function createChart(chart: InsertChart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(charts).values(chart);
  return result[0].insertId;
}

export async function getChartsByPaperId(paperId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(charts).where(eq(charts.paperId, paperId)).orderBy(desc(charts.createdAt));
}

export async function getChartById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(charts).where(eq(charts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateChart(id: number, updates: Partial<InsertChart>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(charts).set(updates).where(eq(charts.id, id));
}

export async function deleteChart(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(charts).where(eq(charts.id, id));
}

// Folder functions
export async function createFolder(folder: InsertFolder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(folders).values(folder);
  return result[0].insertId;
}

export async function getFoldersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(folders).where(eq(folders.userId, userId)).orderBy(desc(folders.createdAt));
}

export async function updateFolder(id: number, updates: Partial<InsertFolder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(folders).set(updates).where(eq(folders.id, id));
}

export async function deleteFolder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(folders).where(eq(folders.id, id));
}

// Tag functions
export async function createTag(tag: InsertPaperTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(paperTags).values(tag);
  return result[0].insertId;
}

export async function getTagsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paperTags).where(eq(paperTags.userId, userId));
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(paperTags).where(eq(paperTags.id, id));
}

export async function addTagToPaper(paperId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(paperTagAssociations).values({ paperId, tagId });
}

export async function removeTagFromPaper(paperId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(paperTagAssociations).where(and(eq(paperTagAssociations.paperId, paperId), eq(paperTagAssociations.tagId, tagId)));
}

export async function getTagsForPaper(paperId: number) {
  const db = await getDb();
  if (!db) return [];
  const assocs = await db.select().from(paperTagAssociations).where(eq(paperTagAssociations.paperId, paperId));
  if (assocs.length === 0) return [];
  const tagIds = assocs.map(a => a.tagId);
  const allTags = [];
  for (const tagId of tagIds) {
    const result = await db.select().from(paperTags).where(eq(paperTags.id, tagId)).limit(1);
    if (result.length > 0) allTags.push(result[0]);
  }
  return allTags;
}

// Soft delete / recycle bin functions
export async function softDeletePaper(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(papers).set({ isDeleted: 1, deletedAt: new Date() }).where(eq(papers.id, id));
}

export async function restoreDeletedPaper(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(papers).set({ isDeleted: 0, deletedAt: null }).where(eq(papers.id, id));
}

export async function getDeletedPapersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(papers).where(and(eq(papers.userId, userId), eq(papers.isDeleted, 1))).orderBy(desc(papers.deletedAt));
}

export async function getPapersByFolderId(userId: number, folderId: number | null) {
  const db = await getDb();
  if (!db) return [];
  if (folderId === null) {
    return db.select().from(papers).where(and(eq(papers.userId, userId), eq(papers.isDeleted, 0), isNull(papers.folderId))).orderBy(desc(papers.createdAt));
  }
  return db.select().from(papers).where(and(eq(papers.userId, userId), eq(papers.isDeleted, 0), eq(papers.folderId, folderId))).orderBy(desc(papers.createdAt));
}

// Translation functions
export async function createTranslation(translation: InsertTranslation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(translations).values(translation);
  return result[0].insertId;
}

export async function getTranslationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(translations).where(eq(translations.userId, userId)).orderBy(desc(translations.createdAt));
}
