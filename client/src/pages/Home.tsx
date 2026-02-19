import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BookOpen, FileText, GraduationCap, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const paperTypes = [
  { value: "graduation", label: "毕业论文", icon: GraduationCap, description: "本科、硕士、博士毕业论文" },
  { value: "journal", label: "期刊论文", icon: FileText, description: "学术期刊投稿论文" },
  { value: "proposal", label: "开题报告", icon: BookOpen, description: "研究课题开题报告" },
  { value: "professional", label: "职称论文", icon: Sparkles, description: "职称评审论文" },
] as const;

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<string>("");
  const [title, setTitle] = useState("");

  const createPaperMutation = trpc.paper.create.useMutation({
    onSuccess: (data) => {
      toast.success("论文创建成功，开始生成大纲...");
      setLocation(`/paper/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "创建论文失败");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !title.trim()) {
      toast.error("请选择论文类型并输入标题");
      return;
    }
    createPaperMutation.mutate({
      type: selectedType as "graduation" | "journal" | "proposal" | "professional",
      title: title.trim(),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              AI学术论文写作平台
            </h1>
            <p className="text-xl text-muted-foreground">
              通过先进的自然语言处理技术，快速撰写高质量学术论文
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">支持多种论文类型</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            {paperTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card key={type.value} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{type.label}</CardTitle>
                    </div>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          <div className="pt-8">
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => window.location.href = getLoginUrl()}>
              登录开始使用
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI学术论文写作平台
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
              仪表板
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/papers")}>
              我的论文
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">欢迎，{user?.name || user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">开始创作您的学术论文</h1>
            <p className="text-lg text-muted-foreground">
              选择论文类型，输入标题，AI将在1分钟内为您生成完整的论文大纲和内容
            </p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>创建新论文</CardTitle>
              <CardDescription>请选择论文类型并输入您的论文标题</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="paper-type" className="text-base">论文类型</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger id="paper-type" className="h-12">
                      <SelectValue placeholder="请选择论文类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {paperTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="paper-title" className="text-base">论文标题</Label>
                  <Input
                    id="paper-title"
                    placeholder="请输入您的论文标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg"
                  disabled={createPaperMutation.isPending || !selectedType || !title.trim()}
                >
                  {createPaperMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      创建中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      开始生成论文
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6 pt-8">
            <h2 className="text-2xl font-semibold text-center">平台核心功能</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">智能大纲生成</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    根据论文类型和标题，自动生成结构完整、逻辑清晰的论文大纲
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">快速内容生成</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    基于大纲在1分钟内生成8000字以上的学术论文全文内容
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">多格式导出</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    支持导出为Word和PDF格式，方便后续编辑和提交
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
