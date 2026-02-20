import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Clock, Download, History, Loader2, RotateCcw, Save, BookOpen, CheckCircle, FileCode } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import MarkdownEditor from "@/components/MarkdownEditor";
import ReferenceManager from "@/components/ReferenceManager";
import QualityCheckResult from "@/components/QualityCheckResult";
import PolishToolbar from "@/components/PolishToolbar";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const paperTypeNames = {
  graduation: "毕业论文",
  journal: "期刊论文",
  proposal: "开题报告",
  professional: "职称论文",
};

export default function PaperEdit() {
  const { id } = useParams<{ id: string }>();
  const paperId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [outline, setOutline] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [showLatexDialog, setShowLatexDialog] = useState(false);
  const [latexTemplate, setLatexTemplate] = useState<"generic" | "ieee" | "nature" | "elsevier" | "springer">("generic");
  const utils = trpc.useUtils();

  const { data: paper, isLoading } = trpc.paper.getById.useQuery(
    { id: paperId },
    { enabled: !!paperId && isAuthenticated }
  );

  const { data: versions } = trpc.paper.getVersions.useQuery(
    { paperId },
    { enabled: !!paperId && isAuthenticated }
  );

  const { data: qualityChecks } = trpc.quality.getHistory.useQuery(
    { paperId },
    { enabled: !!paperId && isAuthenticated }
  );

  const checkQualityMutation = trpc.quality.check.useMutation({
    onSuccess: () => {
      utils.quality.getHistory.invalidate({ paperId });
      toast.success("质量检测完成");
      setShowQualityCheck(true);
    },
    onError: (error) => {
      toast.error(`检测失败: ${error.message}`);
    },
  });

  const saveEditMutation = trpc.paper.saveEdit.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      toast.success("保存成功！");
      utils.paper.getById.invalidate({ id: paperId });
      utils.paper.getVersions.invalidate({ paperId });
    },
    onError: (error) => {
      setIsSaving(false);
      toast.error(error.message || "保存失败");
    },
  });

  const restoreVersionMutation = trpc.paper.restoreVersion.useMutation({
    onSuccess: () => {
      toast.success("版本恢复成功！");
      utils.paper.getById.invalidate({ id: paperId });
      utils.paper.getVersions.invalidate({ paperId });
      setShowVersions(false);
    },
    onError: (error) => {
      toast.error(error.message || "恢复失败");
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

  const { data: latexTemplates } = trpc.latex.getTemplates.useQuery();

  const exportLatexMutation = trpc.latex.export.useMutation({
    onSuccess: (data) => {
      toast.success("导出LaTeX成功！");
      setShowLatexDialog(false);
      if (data.url) {
        // Download the .tex file
        const link = document.createElement('a');
        link.href = data.url;
        link.download = data.fileName;
        link.click();
      }
    },
    onError: (error) => {
      toast.error(error.message || "导出LaTeX失败");
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
      return;
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (paper) {
      setOutline(paper.outline || "");
      setContent(paper.content || "");
    }
  }, [paper]);

  const handleSave = () => {
    setIsSaving(true);
    saveEditMutation.mutate({
      id: paperId,
      outline,
      content,
      changeDescription: "手动保存",
    });
  };

  const handleRestoreVersion = (versionId: number) => {
    restoreVersionMutation.mutate({ versionId });
  };

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
        <Card>
          <CardHeader>
            <CardTitle>论文不存在</CardTitle>
            <CardDescription>未找到该论文</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/papers")}>返回列表</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation(`/paper/${paperId}`)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{paper.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {paperTypeNames[paper.type as keyof typeof paperTypeNames]} - 编辑模式
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={showVersions} onOpenChange={setShowVersions}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <History className="mr-2 h-4 w-4" />
                    版本历史
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>版本历史</DialogTitle>
                    <DialogDescription>查看和恢复历史版本</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {versions && versions.length > 0 ? (
                      versions.map((version) => (
                        <Card key={version.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">版本 {version.versionNumber}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(version.createdAt), {
                                    addSuffix: true,
                                    locale: zhCN,
                                  })}
                                </CardDescription>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestoreVersion(version.id)}
                                disabled={restoreVersionMutation.isPending}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                恢复
                              </Button>
                            </div>
                          </CardHeader>
                          {version.changeDescription && (
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{version.changeDescription}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">暂无版本历史</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </>
                )}
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <BookOpen className="mr-2 h-4 w-4" />
                    参考文献
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>参考文献管理</SheetTitle>
                    <SheetDescription>
                      搜索、添加和管理论文的参考文献
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 h-[calc(100vh-120px)]">
                    <ReferenceManager paperId={paperId} />
                  </div>
                </SheetContent>
              </Sheet>
              <Dialog open={showQualityCheck} onOpenChange={setShowQualityCheck}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!qualityChecks || qualityChecks.length === 0) {
                        checkQualityMutation.mutate({ paperId });
                      } else {
                        setShowQualityCheck(true);
                      }
                    }}
                    disabled={checkQualityMutation.isPending}
                  >
                    {checkQualityMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        检测中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        质量检测
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>论文质量检测报告</DialogTitle>
                    <DialogDescription>
                      查看论文的质量评分和改进建议
                    </DialogDescription>
                  </DialogHeader>
                  {qualityChecks && qualityChecks.length > 0 && (
                    <QualityCheckResult result={qualityChecks[0]} />
                  )}
                </DialogContent>
              </Dialog>
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
              <Dialog open={showLatexDialog} onOpenChange={setShowLatexDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileCode className="mr-2 h-4 w-4" />
                    导出LaTeX
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>选择LaTeX模板</DialogTitle>
                    <DialogDescription>
                      选择适合您目标期刊的LaTeX模板
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      {latexTemplates?.map((template) => (
                        <div
                          key={template.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            latexTemplate === template.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setLatexTemplate(template.id)}
                        >
                          <div className="font-semibold">{template.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">{template.description}</div>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => exportLatexMutation.mutate({ paperId, template: latexTemplate })}
                      disabled={exportLatexMutation.isPending}
                    >
                      {exportLatexMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          导出中...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          确认导出
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="outline" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="outline">编辑大纲</TabsTrigger>
            <TabsTrigger value="content">编辑全文</TabsTrigger>
          </TabsList>

          <TabsContent value="outline" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>论文大纲</CardTitle>
                    <CardDescription>编辑论文的结构大纲</CardDescription>
                  </div>
                  <PolishToolbar
                    selectedText={selectedText}
                    onReplace={(newText) => {
                      const textarea = document.querySelector(".rc-md-editor textarea") as HTMLTextAreaElement;
                      if (textarea && selectedText) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newValue = outline.substring(0, start) + newText + outline.substring(end);
                        setOutline(newValue);
                        setSelectedText("");
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  onMouseUp={() => {
                    const selection = window.getSelection();
                    const text = selection?.toString() || "";
                    if (text.trim()) {
                      setSelectedText(text);
                    }
                  }}
                >
                  <MarkdownEditor
                    value={outline}
                    onChange={setOutline}
                    placeholder="请输入论文大纲..."
                    height={700}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>论文全文</CardTitle>
                    <CardDescription>编辑论文的完整内容</CardDescription>
                  </div>
                  <PolishToolbar
                    selectedText={selectedText}
                    onReplace={(newText) => {
                      const textarea = document.querySelector(".rc-md-editor textarea") as HTMLTextAreaElement;
                      if (textarea && selectedText) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newValue = content.substring(0, start) + newText + content.substring(end);
                        setContent(newValue);
                        setSelectedText("");
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  onMouseUp={() => {
                    const selection = window.getSelection();
                    const text = selection?.toString() || "";
                    if (text.trim()) {
                      setSelectedText(text);
                    }
                  }}
                >
                  <MarkdownEditor
                    value={content}
                    onChange={setContent}
                    placeholder="请输入论文全文..."
                    height={700}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
