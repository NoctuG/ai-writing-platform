import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/fluent/badge";
import { Button } from "@/components/fluent/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/fluent/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/fluent/dialog";
import { trpc } from "@/lib/trpc";
import {
  Dropdown,
  Input,
  Option,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  FileText,
  FolderOpen,
  LayoutGrid,
  Loader2,
  Search,
  Table2,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

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

type StatusFilter = "all" | keyof typeof statusNames;
type TypeFilter = "all" | keyof typeof paperTypeNames;
type SortBy = "createdAt" | "updatedAt";
type ViewMode = "card" | "table";

export default function PaperList() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const { data: papers, isLoading } = trpc.paper.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteMutation = trpc.paper.delete.useMutation({
    onSuccess: () => {
      toast.success("论文已删除");
      setDeleteTarget(null);
      utils.paper.list.invalidate();
    },
    onError: error => {
      toast.error(error.message || "删除失败");
    },
  });

  const filteredPapers = useMemo(() => {
    if (!papers) {
      return [];
    }

    return [...papers]
      .filter(paper => {
        const matchesSearch = paper.title
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());
        const matchesStatus =
          statusFilter === "all" || paper.status === statusFilter;
        const matchesType = typeFilter === "all" || paper.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort(
        (a, b) => new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime()
      );
  }, [papers, searchTerm, statusFilter, typeFilter, sortBy]);

  const statusBadge = (status: keyof typeof statusNames) => {
    if (status === "completed") {
      return (
        <Badge
          className="gap-1 border border-green-300 bg-green-100 text-green-700"
          aria-label={`论文状态：${statusNames[status]}，可继续查看详情`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {statusNames[status]}
        </Badge>
      );
    }

    if (status === "generating") {
      return (
        <Badge
          className="gap-1 border border-blue-300 bg-blue-100 text-blue-700"
          aria-label={`论文状态：${statusNames[status]}，系统正在生成内容`}
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {statusNames[status]}
        </Badge>
      );
    }

    return (
      <Badge
        className="gap-1 border border-red-300 bg-red-100 text-red-700"
        aria-label={`论文状态：${statusNames[status]}，请检查错误后重试`}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        {statusNames[status]}
      </Badge>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-2 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">正在加载论文列表，请稍候...</p>
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
      <header className="sticky top-0 z-10 border-b bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-bold text-transparent">
            AI学术论文写作平台
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setLocation("/recycle-bin")}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              回收站
            </Button>
            <Button onClick={() => setLocation("/")}>创建新论文</Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold">我的论文</h2>
              <p className="mt-2 text-muted-foreground">管理您创建的所有论文</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                onClick={() => setViewMode("card")}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                卡片视图
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                onClick={() => setViewMode("table")}
              >
                <Table2 className="mr-2 h-4 w-4" />
                表格视图
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="grid grid-cols-1 gap-3 py-4 md:grid-cols-4">
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索论文标题"
                contentBefore={<Search className="h-4 w-4" />}
                aria-label="搜索论文"
              />
              <Dropdown
                selectedOptions={[statusFilter]}
                value={statusFilter}
                onOptionSelect={(_, data) =>
                  setStatusFilter((data.optionValue as StatusFilter) || "all")
                }
              >
                <Option value="all">全部状态</Option>
                <Option value="generating">生成中</Option>
                <Option value="completed">已完成</Option>
                <Option value="failed">失败</Option>
              </Dropdown>
              <Dropdown
                selectedOptions={[typeFilter]}
                value={typeFilter}
                onOptionSelect={(_, data) =>
                  setTypeFilter((data.optionValue as TypeFilter) || "all")
                }
              >
                <Option value="all">全部类型</Option>
                <Option value="graduation">毕业论文</Option>
                <Option value="journal">期刊论文</Option>
                <Option value="proposal">开题报告</Option>
                <Option value="professional">职称论文</Option>
              </Dropdown>
              <Dropdown
                selectedOptions={[sortBy]}
                value={sortBy}
                onOptionSelect={(_, data) =>
                  setSortBy((data.optionValue as SortBy) || "createdAt")
                }
              >
                <Option value="createdAt">按创建时间排序</Option>
                <Option value="updatedAt">按更新时间排序</Option>
              </Dropdown>
            </CardContent>
          </Card>

          {deleteMutation.isPending && (
            <Card>
              <CardContent className="flex items-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在删除论文，请稍候...
              </CardContent>
            </Card>
          )}

          {!papers || papers.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">还没有论文</h3>
                <p className="mb-6 text-muted-foreground">
                  创建您的第一篇AI论文，开始高效写作
                </p>
                <Button onClick={() => setLocation("/")}>开始创作</Button>
              </CardContent>
            </Card>
          ) : filteredPapers.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">没有匹配的论文</h3>
                <p className="mb-6 text-muted-foreground">
                  请调整搜索关键词或筛选条件
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setSortBy("createdAt");
                  }}
                >
                  重置筛选
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredPapers.map(paper => (
                <Card
                  key={paper.id}
                  className="border-2 transition-colors hover:border-primary/50"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className="border border-primary/20 bg-primary/10 text-primary"
                            aria-label={`论文类型：${paperTypeNames[paper.type as keyof typeof paperTypeNames]}`}
                          >
                            {
                              paperTypeNames[
                                paper.type as keyof typeof paperTypeNames
                              ]
                            }
                          </Badge>
                          {statusBadge(
                            paper.status as keyof typeof statusNames
                          )}
                        </div>
                        <CardTitle
                          className="cursor-pointer text-xl transition-colors hover:text-primary"
                          onClick={() => setLocation(`/paper/${paper.id}`)}
                        >
                          {paper.title}
                        </CardTitle>
                        <CardDescription>
                          创建时间：
                          {new Date(paper.createdAt).toLocaleString("zh-CN")} ·
                          更新时间：
                          {new Date(paper.updatedAt).toLocaleString("zh-CN")}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/paper/${paper.id}`)}
                        >
                          查看详情
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleteMutation.isPending}
                          onClick={() =>
                            setDeleteTarget({
                              id: paper.id,
                              title: paper.title,
                            })
                          }
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="overflow-x-auto py-4">
                <Table aria-label="论文列表表格视图">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>标题</TableHeaderCell>
                      <TableHeaderCell>类型</TableHeaderCell>
                      <TableHeaderCell>状态</TableHeaderCell>
                      <TableHeaderCell>
                        <span className="inline-flex items-center gap-1">
                          <ArrowUpDown className="h-4 w-4" />
                          创建时间
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>更新时间</TableHeaderCell>
                      <TableHeaderCell>操作</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPapers.map(paper => (
                      <TableRow key={paper.id}>
                        <TableCell
                          className="cursor-pointer font-medium"
                          onClick={() => setLocation(`/paper/${paper.id}`)}
                        >
                          {paper.title}
                        </TableCell>
                        <TableCell>
                          {
                            paperTypeNames[
                              paper.type as keyof typeof paperTypeNames
                            ]
                          }
                        </TableCell>
                        <TableCell>
                          {statusBadge(
                            paper.status as keyof typeof statusNames
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(paper.createdAt).toLocaleString("zh-CN")}
                        </TableCell>
                        <TableCell>
                          {new Date(paper.updatedAt).toLocaleString("zh-CN")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/paper/${paper.id}`)}
                            >
                              查看
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deleteMutation.isPending}
                              onClick={() =>
                                setDeleteTarget({
                                  id: paper.id,
                                  title: paper.title,
                                })
                              }
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除论文《{deleteTarget?.title ?? ""}
              》吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending || !deleteTarget}
              onClick={() =>
                deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })
              }
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1 h-4 w-4" />
              )}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
