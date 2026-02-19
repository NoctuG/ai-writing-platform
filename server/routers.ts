import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createPaper, deletePaper, getPaperById, getPapersByUserId, updatePaper } from "./db";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";
import { generateWordDocument, generatePdfDocument } from "./documentExport";

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
  }),
});

export type AppRouter = typeof appRouter;
