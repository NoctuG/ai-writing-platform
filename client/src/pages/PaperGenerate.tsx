import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Download, FileText, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const paperTypeNames = {
  graduation: "毕业论文",
  journal: "期刊论文",
  proposal: "开题报告",
  professional: "职称论文",
};

export default function PaperGenerate() {
  const { id } = useParams<{ id: string }>();
  const paperId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<"outline" | "content" | "completed">("outline");

  const { data: paper, isLoading, refetch } = trpc.paper.getById.useQuery(
    { id: paperId },
    { enabled: !!paperId && isAuthenticated }
  );

  const generateOutlineMutation = trpc.paper.generateOutline.useMutation({
    onSuccess: () => {
      setCurrentStep("content");
      setProgress(50);
      refetch();
      toast.success("大纲生成成功！");
    },
    onError: (error) => {
      toast.error(error.message || "生成大纲失败");
    },
  });

  const generateContentMutation = trpc.paper.generateContent.useMutation({
    onSuccess: () => {
      setCurrentStep("completed");
      setProgress(100);
      refetch();
      toast.success("论文生成完成！");
    },
    onError: (error) => {
      toast.error(error.message || "生成内容失败");
    },
  });

  const exportWordMutation = trpc.paper.exportWord.useMutation({
    onSuccess: (data) => {
      toast.success("导出Word成功！");
      window.open(data.fileUrl, "_blank");
    },
    onError: (error) => {
      toast.error(error.message || "导出Word失败");
    },
  });

  const exportPdfMutation = trpc.paper.exportPdf.useMutation({
    onSuccess: (data) => {
      toast.success("导出PDF成功！");
      window.open(data.fileUrl, "_blank");
    },
    onError: (error) => {
      toast.error(error.message || "导出PDF失败");
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
      return;
    }

    if (paper && !paper.outline && currentStep === "outline" && !generateOutlineMutation.isPending) {
      generateOutlineMutation.mutate({ paperId });
    }
  }, [paper, authLoading, isAuthenticated]);

  useEffect(() => {
    if (paper?.outline && !paper.content && currentStep === "content" && !generateContentMutation.isPending) {
      const timer = setTimeout(() => {
        generateContentMutation.mutate({ paperId });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [paper, currentStep]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>论文不存在</CardTitle>
            <CardDescription>未找到指定的论文</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")}>返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isGenerating = generateOutlineMutation.isPending || generateContentMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI学术论文写作平台
          </h1>
          <Button variant="ghost" onClick={() => setLocation("/")}>
            返回首页
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {paperTypeNames[paper.type as keyof typeof paperTypeNames]}
                    </span>
                    {paper.status === "completed" && (
                      <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        已完成
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{paper.title}</CardTitle>
                  <CardDescription>
                    创建时间：{new Date(paper.createdAt).toLocaleString("zh-CN")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">生成进度</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border-2 ${currentStep === "outline" || paper.outline ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {paper.outline ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : currentStep === "outline" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    <span className="font-medium">生成大纲</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {paper.outline ? "大纲已生成" : currentStep === "outline" ? "正在生成大纲..." : "等待中"}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border-2 ${currentStep === "content" || paper.content ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {paper.content ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : currentStep === "content" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    <span className="font-medium">生成全文</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {paper.content ? "全文已生成" : currentStep === "content" ? "正在生成全文..." : "等待中"}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border-2 ${currentStep === "completed" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {currentStep === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    <span className="font-medium">完成</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentStep === "completed" ? "可以查看和导出" : "等待中"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {paper.outline && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>论文大纲</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{paper.outline}</Streamdown>
                </div>
              </CardContent>
            </Card>
          )}

          {paper.content && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <CardTitle>论文全文</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => exportWordMutation.mutate({ id: paperId })}
                        disabled={exportWordMutation.isPending}
                      >
                        {exportWordMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            导出中...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            导出Word
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => exportPdfMutation.mutate({ id: paperId })}
                        disabled={exportPdfMutation.isPending}
                      >
                        {exportPdfMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            导出中...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            导出PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <Streamdown>{paper.content}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
