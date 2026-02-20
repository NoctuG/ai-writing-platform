import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/fluent/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/fluent/card";
import { Skeleton } from "@/components/fluent/skeleton";
import { FileText, TrendingUp, BookOpen, BarChart3 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { DistributionChartCard } from "@/components/DistributionChartCard";
import FluentEmptyState, { createEmptyStateCopy } from "@/components/FluentEmptyState";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = trpc.dashboard.getStatistics.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <main className="container py-8 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48 rounded bg-muted animate-pulse" />
            <Skeleton className="h-4 w-72 rounded bg-muted animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20 rounded bg-muted animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-16 rounded bg-muted animate-pulse" />
                  <Skeleton className="h-3 w-24 rounded bg-muted animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-5 w-40 rounded bg-muted animate-pulse" />
                  <Skeleton className="h-4 w-52 rounded bg-muted animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 4 }).map((__, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20 rounded bg-muted animate-pulse" />
                      <Skeleton className="h-2 w-40 rounded bg-muted animate-pulse" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/5">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>需要登录</CardTitle>
            <CardDescription>请先登录以查看您的仪表板</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paperTypeLabels: Record<string, string> = {
    graduation: "毕业论文",
    journal: "期刊论文",
    proposal: "开题报告",
    professional: "职称论文",
  };

  const citationFormatLabels: Record<string, string> = {
    gbt7714: "GB/T 7714",
    apa: "APA",
    mla: "MLA",
    chicago: "Chicago",
  };

  const paperTypeItems = (stats?.paperTypeDistribution || []).map((item) => ({
    id: item.type,
    label: paperTypeLabels[item.type] || item.type,
    count: item.count,
  }));

  const citationFormatItems = (stats?.citationFormatDistribution || []).map((item) => ({
    id: item.format,
    label: citationFormatLabels[item.format] || item.format,
    count: item.count,
  }));

  const citationTotal = citationFormatItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI学术论文写作平台
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              首页
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

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">数据仪表板</h2>
          <p className="text-muted-foreground">查看您的论文创作统计和质量分析</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                总论文数
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-3xl font-bold"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                {stats?.totalPapers || 0}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                已完成 {stats?.completedPapers || 0} 篇
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                平均质量评分
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-3xl font-bold"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
              >
                {stats?.averageQualityScore || 0}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">满分 100 分</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                参考文献数
              </CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-3xl font-bold"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
              >
                {stats?.citationFormatDistribution?.reduce((sum, item) => sum + item.count, 0) || 0}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">已添加的文献</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                质量检测次数
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-3xl font-bold"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 }}
              >
                {stats?.qualityTrend?.length || 0}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">最近30天</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Paper Type Distribution */}
          <DistributionChartCard
            title="论文类型分布"
            description="您创建的不同类型论文数量"
            items={paperTypeItems}
            total={stats?.totalPapers || 0}
            tone="primary"
            enableAnimation
            emptyTitle="还没有论文类型数据"
            emptyDescription="先创建第一篇论文，系统会自动生成类型分布图。"
            emptyActionLabel="去创建论文"
            onEmptyAction={() => setLocation("/")}
          />

          {/* Citation Format Distribution */}
          <DistributionChartCard
            title="引用格式分布"
            description="您使用的不同引用格式统计"
            items={citationFormatItems}
            total={citationTotal}
            tone="secondary"
            enableAnimation
            emptyTitle="还没有引用格式数据"
            emptyDescription="添加文献后，这里会展示引用格式偏好与占比。"
            emptyActionLabel="去管理文献"
            onEmptyAction={() => setLocation("/papers")}
          />
        </div>

        {/* Recent Papers */}
        <Card>
          <CardHeader>
            <CardTitle>最近的论文</CardTitle>
            <CardDescription>您最近创建的论文列表</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentPapers && stats.recentPapers.length > 0 ? (
              <div className="space-y-4">
                {stats.recentPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/paper/${paper.id}`)}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{paper.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {paperTypeLabels[paper.type] || paper.type} •{" "}
                        {new Date(paper.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          paper.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : paper.status === "generating"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {paper.status === "completed"
                          ? "已完成"
                          : paper.status === "generating"
                          ? "生成中"
                          : "失败"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <FluentEmptyState
                icon={FileText}
                title="还没有创建任何论文"
                copy={createEmptyStateCopy({
                  reason: "当前统计周期内暂无论文记录，因此无法展示最近创作动态。",
                  nextStep: "先创建一篇新论文，稍后即可在这里快速回到最近编辑项。",
                  actionLabel: "开始创建",
                })}
                primaryAction={{
                  label: "开始创建",
                  onClick: () => setLocation("/"),
                }}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
