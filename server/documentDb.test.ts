import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createKnowledgeDocument,
  getKnowledgeDocumentById,
  getKnowledgeDocumentsByUserId,
  updateKnowledgeDocument,
  deleteKnowledgeDocument,
} from './documentDb';
import * as db from './db';

// Mock the database module
vi.mock('./db', () => ({
  getDb: vi.fn(),
}));

describe('Document Database Operations', () => {
  const mockDb = {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getDb).mockResolvedValue(mockDb as any);
  });

  describe('createKnowledgeDocument', () => {
    it('should create a new document', async () => {
      const mockInsertResult = {
        0: { insertId: 123 },
      };

      const mockDocument = {
        id: 123,
        userId: 1,
        fileName: 'test.pdf',
        fileKey: 'key123',
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        status: 'uploading',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(mockInsertResult),
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockDocument]),
          }),
        }),
      });

      const result = await createKnowledgeDocument({
        userId: 1,
        fileName: 'test.pdf',
        fileKey: 'key123',
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        status: 'uploading',
      });

      expect(result.id).toBe(123);
      expect(result.fileName).toBe('test.pdf');
    });

    it('should throw error when database is not available', async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      await expect(
        createKnowledgeDocument({
          userId: 1,
          fileName: 'test.pdf',
          fileKey: 'key123',
          fileUrl: 'https://example.com/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          status: 'uploading',
        })
      ).rejects.toThrow('Database not available');
    });
  });

  describe('getKnowledgeDocumentById', () => {
    it('should return document by id', async () => {
      const mockDocument = {
        id: 123,
        userId: 1,
        fileName: 'test.pdf',
        status: 'ready',
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockDocument]),
          }),
        }),
      });

      const result = await getKnowledgeDocumentById(123);

      expect(result).toEqual(mockDocument);
    });

    it('should return null if document not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await getKnowledgeDocumentById(999);

      expect(result).toBeNull();
    });
  });

  describe('getKnowledgeDocumentsByUserId', () => {
    it('should return all documents for a user', async () => {
      const mockDocuments = [
        { id: 1, userId: 1, fileName: 'doc1.pdf' },
        { id: 2, userId: 1, fileName: 'doc2.pdf' },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockDocuments),
          }),
        }),
      });

      const result = await getKnowledgeDocumentsByUserId(1);

      expect(result).toHaveLength(2);
      expect(result[0].fileName).toBe('doc1.pdf');
    });
  });

  describe('updateKnowledgeDocument', () => {
    it('should update document fields', async () => {
      const mockUpdatedDoc = {
        id: 123,
        status: 'ready',
        summary: 'Updated summary',
      };

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUpdatedDoc]),
          }),
        }),
      });

      const result = await updateKnowledgeDocument(123, {
        status: 'ready',
        summary: 'Updated summary',
      });

      expect(result?.status).toBe('ready');
      expect(result?.summary).toBe('Updated summary');
    });

    it('should return null if document not found after update', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await updateKnowledgeDocument(999, { status: 'ready' });

      expect(result).toBeNull();
    });
  });

  describe('deleteKnowledgeDocument', () => {
    it('should delete document', async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const result = await deleteKnowledgeDocument(123);

      expect(result).toBe(true);
    });

    it('should throw error when database is not available', async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      await expect(deleteKnowledgeDocument(123)).rejects.toThrow('Database not available');
    });
  });
});
