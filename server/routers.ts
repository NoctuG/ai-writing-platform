import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createPaper, createPaperVersion, deletePaper, getLatestVersionNumber, getPaperById, getPapersByUserId, getPaperVersionById, getPaperVersionsByPaperId, updatePaper, createReference, getReferencesByPaperId, deleteReference, updateReference, createQualityCheck, getQualityChecksByPaperId, getLatestQualityCheck } from "./db";
import { checkPaperQuality, checkGrammar } from "./qualityChecker";
import { formatReference, type ReferenceData } from "./referenceFormatter";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";
import { generateWordDocument, generatePdfDocument } from "./documentExport";
import { polishText, polishParagraphs, type PolishType } from "./textPolisher";


export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  paper: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        type: z.enum(["graduation", "journal", "proposal", "professional"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const paperId = await createPaper({
          userId: ctx.user.id,
          title: input.title,
          type: input.type,
          status: "generating",
        });
        return { id: paperId };
      }),

    generateOutline: protectedProcedure
      .input(z.object({
        paperId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const paper = await getPaperById(input.paperId);
        if (!paper) {
          throw new TRPCError({ code: "NOT_FOUND", message: "论文不存在" });
        }
        if (paper.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权访问此论文" });
        }

        try {
          const typeNames = {
            graduation: "毕业论文",
            journal: "期刊论文",
            proposal: "开题报告",
            professional: "职称论文",
          };

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `你是一位资深的学术论文写作专家。你需要根据用户提供的论文类型和标题，生成一份详细的学术论文大纲。

要求：
1. 大纲应包含完整的章节结构
2. 每个章节应有清晰的小节划分
3. 使用学术化的语言
4. 符合${typeNames[paper.type as keyof typeof typeNames]}的规范和要求
5. 大纲应该详细且具有逻辑性

请以Markdown格式输出大纲，使用标题层级（#, ##, ###）来表示章节结构。`,
              },
              {
                role: "user",
                content: `论文类型：${typeNames[paper.type as keyof typeof typeNames]}\n论文标题：${paper.title}\n\n请生成详细的论文大纲。`,
              },
            ],
          });

          const outlineContent = response.choices[0]?.message?.content;
          const outline = typeof outlineContent === 'string' ? outlineContent : "";
          await updatePaper(input.paperId, { outline });

          return { outline };
        } catch (error) {
          await updatePaper(input.paperId, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "生成大纲失败",
          });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "生成大纲失败" });
        }
      }),

    generateContent: protectedProcedure
      .input(z.object({
        paperId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const paper = await getPaperById(input.paperId);
        if (!paper) {
          throw new TRPCError({ code: "NOT_FOUND", message: "论文不存在" });
        }
        if (paper.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权访问此论文" });
        }
        if (!paper.outline) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "请先生成大纲" });
        }

        try {
          const typeNames = {
            graduation: "毕业论文",
            journal: "期刊论文",
            proposal: "开题报告",
            professional: "职称论文",
          };

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `你是一位资深的学术论文写作专家。你需要根据提供的论文大纲，撰写完整的学术论文内容。

要求：
1. 使用学术化的语言风格
2. 内容必须以完整的段落形式输出
3. 每个章节应有充实的内容，字数不少于8000字
4. 可以在段落间插入表格进行阐述
5. 符合${typeNames[paper.type as keyof typeof typeNames]}的规范和要求
6. 内容应具有学术深度和专业性
7. 适当引用相关研究（可以使用占位符如[1][2]表示引用）

请以Markdown格式输出论文全文。`,
              },
              {
                role: "user",
                content: `论文标题：${paper.title}\n\n论文大纲：\n${paper.outline}\n\n请根据以上大纲撰写完整的论文内容。`,
              },
            ],
          });

          const contentData = response.choices[0]?.message?.content;
          const content = typeof contentData === 'string' ? contentData : "";
          await updatePaper(input.paperId, {
            content,
            status: "completed",
          });

          return { content };
        } catch (error) {
          await updatePaper(input.paperId, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "生成内容失败",
          });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "生成内容失败" });
        }
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return getPapersByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const paper = await getPaperById(input.id);
        if (!paper) {
          throw new TRPCError({ code: "NOT_FOUND", message: "论文不存在" });
        }
        if (paper.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权访问此论文" });
        }
        return paper;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const paper = await getPaperById(input.id);
        if (!paper) {
          throw new TRPCError({ code: "NOT_FOUND", message: "论文不存在" });
        }
        if (paper.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权访问此论文" });
        }
        await deletePaper(input.id);
        return { success: true };
      }),

    exportWord: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const paper = await getPaperById(input.id);
        if (!paper) {
          throw new TRPCError({ code: "NOT_FOUND", message: "论文不存在" });
        }
        if (paper.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权访问此论文" });
        }
        if (!paper.content || !paper.outline) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "论文尚未生成完成" });
        }

        try {
          const { fileKey, fileUrl } = await generateWordDocument({
            title: paper.title,
            type: paper.type,
            outline: paper.outline,
            content: paper.content,
          });

          await updatePaper(input.id, {
            wordFileKey: fileKey,
            wordFileUrl: fileUrl,
          });

          return { fileUrl };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "导出Word失败" });
        }
      }),

    exportPdf: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const paper = await getPaperById(input.id);
        if (!paper) {
          throw new TRPCError({ code: "NOT_FOUND", message: "论文不存在" });
        }
        if (paper.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权访问此论文" });
        }
        if (!paper.content || !paper.outline) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "论文尚未生成完成" });
        }

        try {
          const { fileKey, fileUrl } = await generatePdfDocument({
            title: paper.title,
            type: paper.type,
            outline: paper.outline,
            content: paper.content,
          });

          await updatePaper(input.id, {
            pdfFileKey: fileKey,
            pdfFileUrl: fileUrl,
          });

          return { fileUrl };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "导出PDF失败" });
        }
      }),

    saveEdit: protectedProcedure
      .input(z.object({
        id: z.number(),
        outline: z.string().optional(),
        content: z.string().optional(),
        changeDescription: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const paper = await getPaperById(input.id);
        if (!paper) {
          throw new TRPCError({ code: "NOT_FOUND", message: "论文不存在" });
        }
        if (paper.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权访问此论文" });
        }

        // Create a version snapshot before updating
        const latestVersion = await getLatestVersionNumber(input.id);
        const newVersionNumber = latestVersion + 1;

        await createPaperVersion({
          paperId: input.id,
          versionNumber: newVersionNumber,
          outline: input.outline || paper.outline || null,
          content: input.content || paper.content || null,
          changeDescription: input.changeDescription || "编辑修改",
        });

        // Update the paper
        const updates: Partial<typeof paper> = {};
        if (input.outline !== undefined) updates.outline = input.outline;
        if (input.content !== undefined) updates.content = input.content;

        await updatePaper(input.id, updates);

        return { success: true, versionNumber: newVersionNumber };
      }),

    getVersions: protectedProcedure
      .input(z.object({ paperId: z.number() }))
      .query(async ({ ctx, input }) => {
        const paper = await getPaperById(input.paperId);
        if (!paper) {
          throw new TRPCError({ code: "NOT_FOUND", message: "论文不存在" });
        }
        if (paper.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权访问此论文" });
        }

        return getPaperVersionsByPaperId(input.paperId);
      }),

    restoreVersion: protectedProcedure
      .input(z.object({ versionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const version = await getPaperVersionById(input.versionId);
        if (!version) {
          throw new TRPCError({ code: "NOT_FOUND", message: "版本不存在" });
        }

        const paper = await getPaperById(version.paperId);
        if (!paper) {
          throw new TRPCError({ code: "NOT_FOUND", message: "论文不存在" });
        }
        if (paper.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权访问此论文" });
        }

        // Create a new version before restoring
        const latestVersion = await getLatestVersionNumber(version.paperId);
        const newVersionNumber = latestVersion + 1;

        await createPaperVersion({
          paperId: version.paperId,
          versionNumber: newVersionNumber,
          outline: version.outline,
          content: version.content,
          changeDescription: `恢复到版本 ${version.versionNumber}`,
        });

        // Restore the version
        await updatePaper(version.paperId, {
          outline: version.outline || undefined,
          content: version.content || undefined,
        });

        return { success: true };
      }),
  }),

  reference: router({
    search: protectedProcedure
      .input(z.object({
        paperId: z.number(),
        query: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        // 模拟学术数据库搜索（使用LLM生成真实的参考文献）
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "你是一个学术文献搜索助手。根据用户提供的关键词，搜索并返回真实的、可验证的学术文献。优先使用中文数据库（CNKI、万方）中的文献。返回5-10篇相关文献。",
              },
              {
                role: "user",
                content: `搜索关键词：${input.query}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "reference_search_results",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    references: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "文献标题" },
                          authors: { type: "array", items: { type: "string" }, description: "作者列表" },
                          year: { type: "number", description: "发表年份" },
                          journal: { type: "string", description: "期刊名称" },
                          volume: { type: "string", description: "卷号" },
                          issue: { type: "string", description: "期号" },
                          pages: { type: "string", description: "页码" },
                          doi: { type: "string", description: "DOI" },
                          url: { type: "string", description: "文献链接" },
                        },
                        required: ["title", "authors", "year", "journal"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["references"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (!content || typeof content !== "string") {
            throw new Error("搜索结果为空");
          }

          const result = JSON.parse(content);
          return result.references || [];
        } catch (error: any) {
          console.error("[Reference Search] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "搜索文献失败" });
        }
      }),

    add: protectedProcedure
      .input(z.object({
        paperId: z.number(),
        title: z.string(),
        authors: z.array(z.string()),
        year: z.number().optional(),
        journal: z.string().optional(),
        volume: z.string().optional(),
        issue: z.string().optional(),
        pages: z.string().optional(),
        doi: z.string().optional(),
        url: z.string().optional(),
        citationFormat: z.enum(["gbt7714", "apa", "mla", "chicago"]).default("gbt7714"),
      }))
      .mutation(async ({ input }) => {
        const refData: ReferenceData = {
          title: input.title,
          authors: input.authors,
          year: input.year,
          journal: input.journal,
          volume: input.volume,
          issue: input.issue,
          pages: input.pages,
          doi: input.doi,
          url: input.url,
        };

        const formattedCitation = formatReference(refData, input.citationFormat);

        const id = await createReference({
          paperId: input.paperId,
          title: input.title,
          authors: JSON.stringify(input.authors),
          year: input.year,
          journal: input.journal,
          volume: input.volume,
          issue: input.issue,
          pages: input.pages,
          doi: input.doi,
          url: input.url,
          citationFormat: input.citationFormat,
          formattedCitation,
        });

        return { id, formattedCitation };
      }),

    list: protectedProcedure
      .input(z.object({ paperId: z.number() }))
      .query(async ({ input }) => {
        const refs = await getReferencesByPaperId(input.paperId);
        return refs.map((ref) => ({
          ...ref,
          authors: JSON.parse(ref.authors),
        }));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteReference(input.id);
        return { success: true };
      }),

    updateFormat: protectedProcedure
      .input(z.object({
        id: z.number(),
        citationFormat: z.enum(["gbt7714", "apa", "mla", "chicago"]),
      }))
      .mutation(async ({ input }) => {
        const refs = await getReferencesByPaperId(0); // 需要先获取引用
        const ref = refs.find((r) => r.id === input.id);
        if (!ref) {
          throw new TRPCError({ code: "NOT_FOUND", message: "文献不存在" });
        }

        const refData: ReferenceData = {
          title: ref.title,
          authors: JSON.parse(ref.authors),
          year: ref.year || undefined,
          journal: ref.journal || undefined,
          volume: ref.volume || undefined,
          issue: ref.issue || undefined,
          pages: ref.pages || undefined,
          doi: ref.doi || undefined,
          url: ref.url || undefined,
        };

        const formattedCitation = formatReference(refData, input.citationFormat);

        await updateReference(input.id, {
          citationFormat: input.citationFormat,
          formattedCitation,
        });

        return { formattedCitation };
      }),
  }),

  quality: router({
    check: protectedProcedure
      .input(z.object({ paperId: z.number() }))
      .mutation(async ({ input }) => {
        const paper = await getPaperById(input.paperId);
        if (!paper) {
          throw new TRPCError({ code: "NOT_FOUND", message: "论文不存在" });
        }

        if (!paper.content || !paper.outline) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "论文内容或大纲为空" });
        }

        try {
          const result = await checkPaperQuality(paper.content, paper.outline);

          // 保存检测结果
          await createQualityCheck({
            paperId: input.paperId,
            overallScore: result.overallScore,
            plagiarismScore: result.plagiarismScore,
            grammarScore: result.grammarScore,
            academicStyleScore: result.academicStyleScore,
            structureScore: result.structureScore,
            issues: JSON.stringify(result.issues),
            suggestions: JSON.stringify(result.suggestions),
          });

          return result;
        } catch (error: any) {
          console.error("[Quality Check] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "质量检测失败" });
        }
      }),

    getHistory: protectedProcedure
      .input(z.object({ paperId: z.number() }))
      .query(async ({ input }) => {
        const checks = await getQualityChecksByPaperId(input.paperId);
        return checks.map((check) => ({
          ...check,
          issues: check.issues ? JSON.parse(check.issues) : [],
          suggestions: check.suggestions ? JSON.parse(check.suggestions) : [],
        }));
      }),

    getLatest: protectedProcedure
      .input(z.object({ paperId: z.number() }))
      .query(async ({ input }) => {
        const check = await getLatestQualityCheck(input.paperId);
        if (!check) {
          return null;
        }
        return {
          ...check,
          issues: check.issues ? JSON.parse(check.issues) : [],
          suggestions: check.suggestions ? JSON.parse(check.suggestions) : [],
        };
      }),

    checkGrammar: protectedProcedure
      .input(z.object({ text: z.string() }))
      .mutation(async ({ input }) => {
        try {
          return await checkGrammar(input.text);
        } catch (error: any) {
          console.error("[Grammar Check] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "语法检查失败" });
        }
      }),
  }),

  polish: router({
    text: protectedProcedure
      .input(z.object({
        text: z.string().min(1),
        type: z.enum(["expression", "grammar", "academic", "comprehensive"]).default("comprehensive"),
      }))
      .mutation(async ({ input }) => {
        try {
          return await polishText(input.text, input.type as PolishType);
        } catch (error: any) {
          console.error("[Polish] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "润色失败" });
        }
      }),

    paragraphs: protectedProcedure
      .input(z.object({
        paragraphs: z.array(z.string()),
        type: z.enum(["expression", "grammar", "academic", "comprehensive"]).default("comprehensive"),
      }))
      .mutation(async ({ input }) => {
        try {
          return await polishParagraphs(input.paragraphs, input.type as PolishType);
        } catch (error: any) {
          console.error("[Polish Paragraphs] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "批量润色失败" });
        }
      }),
  }),

  dashboard: router({
    getStatistics: protectedProcedure.query(async ({ ctx }) => {
      try {
        const papers = await getPapersByUserId(ctx.user.id);
        const qualityChecks = [];
        const references = [];

        for (const paper of papers) {
          const checks = await getQualityChecksByPaperId(paper.id);
          qualityChecks.push(...checks);

          const refs = await getReferencesByPaperId(paper.id);
          references.push(...refs);
        }

        // 计算统计数据
        const totalPapers = papers.length;
        const completedPapers = papers.filter((p) => p.status === "completed").length;
        const averageQualityScore =
          qualityChecks.length > 0
            ? qualityChecks.reduce((sum, c) => sum + c.overallScore, 0) / qualityChecks.length
            : 0;

        // 质量评分趋势（最近30天）
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentChecks = qualityChecks
          .filter((c) => new Date(c.createdAt) >= thirtyDaysAgo)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        const qualityTrend = recentChecks.map((check) => ({
          date: new Date(check.createdAt).toISOString().split("T")[0],
          score: check.overallScore,
        }));

        // 引用格式分布
        const formatCounts: Record<string, number> = {};
        references.forEach((ref) => {
          const format = ref.citationFormat || "gbt7714";
          formatCounts[format] = (formatCounts[format] || 0) + 1;
        });

        const citationFormatDistribution = Object.entries(formatCounts).map(([format, count]) => ({
          format,
          count,
        }));

        // 论文类型分布
        const typeCounts: Record<string, number> = {};
        papers.forEach((paper) => {
          const type = paper.type || "unknown";
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const paperTypeDistribution = Object.entries(typeCounts).map(([type, count]) => ({
          type,
          count,
        }));

        return {
          totalPapers,
          completedPapers,
          averageQualityScore: Math.round(averageQualityScore * 10) / 10,
          qualityTrend,
          citationFormatDistribution,
          paperTypeDistribution,
          recentPapers: papers.slice(0, 5).map((p) => ({
            id: p.id,
            title: p.title,
            type: p.type,
            status: p.status,
            createdAt: p.createdAt,
          })),
        };
      } catch (error: any) {
        console.error("[Dashboard] Error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "获取统计数据失败" });
      }
    }),

    getQualityComparison: protectedProcedure
      .input(z.object({ paperIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        try {
          const comparisons = [];

          for (const paperId of input.paperIds) {
            const paper = await getPaperById(paperId);
            const latestCheck = await getLatestQualityCheck(paperId);

            if (paper && latestCheck) {
              comparisons.push({
                paperId: paper.id,
                title: paper.title,
                overallScore: latestCheck.overallScore,
                plagiarismScore: latestCheck.plagiarismScore,
                grammarScore: latestCheck.grammarScore,
                academicStyleScore: latestCheck.academicStyleScore,
                structureScore: latestCheck.structureScore,
              });
            }
          }

          return comparisons;
        } catch (error: any) {
          console.error("[Dashboard] Quality comparison error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "质量对比失败" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
