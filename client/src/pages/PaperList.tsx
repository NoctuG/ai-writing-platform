import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/fluent/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/fluent/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/fluent/alert-dialog";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, FileText, Loader2, Trash2, FolderOpen } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const paperTypeNames = {
  graduation: "毕业论文",
  journal: "期刊论文",
  proposal: "开题报告",
  professional: "职称论文",
};

const statusNames = {
  generating: "生成中",
  completed: "已完成",
  failed: "失败",
};

export default function PaperList() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: papers, isLoading } = trpc.paper.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteMutation = trpc.paper.delete.useMutation({
    onSuccess: () => {
      toast.success("论文已删除");
      utils.paper.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "删除失败");
    },
  });

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

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI学术论文写作平台
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/recycle-bin")}>
              <Trash2 className="mr-2 h-4 w-4" />回收站
            </Button>
            <Button onClick={() => setLocation("/")}>创建新论文</Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">我的论文</h2>
              <p className="text-muted-foreground mt-2">管理您创建的所有论文</p>
            </div>
          </div>

          {!papers || papers.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">还没有论文</h3>
                <p className="text-muted-foreground mb-6">创建您的第一篇AI论文</p>
                <Button onClick={() => setLocation("/")}>开始创作</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {papers.map((paper) => (
                <Card key={paper.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {paperTypeNames[paper.type as keyof typeof paperTypeNames]}
                          </span>
                          {paper.status === "completed" && (
                            <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              {statusNames[paper.status]}
                            </span>
                          )}
                          {paper.status === "generating" && (
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {statusNames[paper.status]}
                            </span>
                          )}
                          {paper.status === "failed" && (
                            <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                              {statusNames[paper.status]}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xl cursor-pointer hover:text-primary transition-colors" onClick={() => setLocation(`/paper/${paper.id}`)}>
                          {paper.title}
                        </CardTitle>
                        <CardDescription>
                          创建时间：{new Date(paper.createdAt).toLocaleString("zh-CN")}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setLocation(`/paper/${paper.id}`)}>
                          查看详情
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                您确定要删除论文《{paper.title}》吗？此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: paper.id })}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
