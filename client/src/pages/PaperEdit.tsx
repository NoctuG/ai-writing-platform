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
import { ArrowLeft, Clock, Download, History, Loader2, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import MarkdownEditor from "@/components/MarkdownEditor";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

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
  const utils = trpc.useUtils();

  const { data: paper, isLoading } = trpc.paper.getById.useQuery(
    { id: paperId },
    { enabled: !!paperId && isAuthenticated }
  );

  const { data: versions } = trpc.paper.getVersions.useQuery(
    { paperId },
    { enabled: !!paperId && isAuthenticated }
  );

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
                <CardTitle>论文大纲</CardTitle>
                <CardDescription>编辑论文的结构大纲</CardDescription>
              </CardHeader>
              <CardContent>
                <MarkdownEditor
                  value={outline}
                  onChange={setOutline}
                  placeholder="请输入论文大纲..."
                  height={700}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>论文全文</CardTitle>
                <CardDescription>编辑论文的完整内容</CardDescription>
              </CardHeader>
              <CardContent>
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder="请输入论文全文..."
                  height={700}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
