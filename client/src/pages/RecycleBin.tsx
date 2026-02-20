import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const paperTypeNames: Record<string, string> = {
  graduation: "毕业论文",
  journal: "期刊论文",
  proposal: "开题报告",
  professional: "职称论文",
};

export default function RecycleBin() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: deletedPapers, isLoading } = trpc.paper.getDeleted.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const restoreMutation = trpc.paper.restore.useMutation({
    onSuccess: () => {
      toast.success("论文已恢复");
      utils.paper.getDeleted.invalidate();
      utils.paper.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "恢复失败");
    },
  });

  const permanentDeleteMutation = trpc.paper.permanentDelete.useMutation({
    onSuccess: () => {
      toast.success("论文已永久删除");
      utils.paper.getDeleted.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "删除失败");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
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
            <Button variant="ghost" onClick={() => setLocation("/")}>首页</Button>
            <Button variant="ghost" onClick={() => setLocation("/papers")}>我的论文</Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold">回收站</h2>
            <p className="text-muted-foreground mt-2">已删除的论文可以在此恢复或永久删除</p>
          </div>

          {!deletedPapers || deletedPapers.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Trash2 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">回收站为空</h3>
                <p className="text-muted-foreground">没有已删除的论文</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {deletedPapers.map(paper => (
                <Card key={paper.id} className="border-2 opacity-75 hover:opacity-100 transition-opacity">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            {paperTypeNames[paper.type] || paper.type}
                          </span>
                        </div>
                        <CardTitle className="text-xl">{paper.title}</CardTitle>
                        <CardDescription>
                          删除时间：{paper.deletedAt ? new Date(paper.deletedAt).toLocaleString("zh-CN") : "未知"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreMutation.mutate({ id: paper.id })}
                          disabled={restoreMutation.isPending}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          恢复
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              永久删除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>永久删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要永久删除《{paper.title}》吗？此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => permanentDeleteMutation.mutate({ id: paper.id })}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                永久删除
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
