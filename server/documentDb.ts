import { getDb } from './db';
import { knowledgeDocuments, type InsertKnowledgeDocument, type KnowledgeDocument } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Create a new knowledge document record
 */
export async function createKnowledgeDocument(data: InsertKnowledgeDocument): Promise<KnowledgeDocument> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(knowledgeDocuments).values(data);
  const [document] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, Number(result[0].insertId))).limit(1);
  return document;
}

/**
 * Get knowledge document by ID
 */
export async function getKnowledgeDocumentById(id: number): Promise<KnowledgeDocument | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [document] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, id)).limit(1);
  return document || null;
}

/**
 * Get all knowledge documents for a user
 */
export async function getKnowledgeDocumentsByUserId(userId: number): Promise<KnowledgeDocument[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db
    .select()
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.userId, userId))
    .orderBy(desc(knowledgeDocuments.createdAt));
}

/**
 * Get knowledge documents for a specific paper
 */
export async function getKnowledgeDocumentsByPaperId(paperId: number): Promise<KnowledgeDocument[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db
    .select()
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.paperId, paperId))
    .orderBy(desc(knowledgeDocuments.createdAt));
}

/**
 * Update knowledge document
 */
export async function updateKnowledgeDocument(
  id: number,
  data: Partial<Omit<KnowledgeDocument, 'id' | 'createdAt'>>
): Promise<KnowledgeDocument | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db
    .update(knowledgeDocuments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(knowledgeDocuments.id, id));
  const [updated] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, id)).limit(1);
  return updated || null;
}

/**
 * Delete knowledge document
 */
export async function deleteKnowledgeDocument(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
  return true;
}

/**
 * Get ready documents for a user (status = 'ready')
 */
export async function getReadyDocumentsByUserId(userId: number): Promise<KnowledgeDocument[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db
    .select()
    .from(knowledgeDocuments)
    .where(and(eq(knowledgeDocuments.userId, userId), eq(knowledgeDocuments.status, 'ready')))
    .orderBy(desc(knowledgeDocuments.createdAt));
}
