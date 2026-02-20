import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { BarChart3, Loader2, Plus, Sparkles, Download, Trash2, Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type ChartConfig = {
  chartType: string;
  title: string;
  data: any[];
  xAxisKey: string;
  dataKeys: { key: string; color: string; name: string }[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  description?: string;
};

function ChartPreview({ config, onExport }: { config: ChartConfig; onExport?: (chartId: number) => void }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { chartType, data, xAxisKey, dataKeys, xAxisLabel, yAxisLabel, title } = config;

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -5 } : undefined} />
            <YAxis label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined} />
            <Tooltip />
            <Legend />
            {dataKeys.map(dk => (
              <Line key={dk.key} type="monotone" dataKey={dk.key} stroke={dk.color} name={dk.name} strokeWidth={2} />
            ))}
          </LineChart>
        );
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -5 } : undefined} />
            <YAxis label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined} />
            <Tooltip />
            <Legend />
            {dataKeys.map(dk => (
              <Bar key={dk.key} dataKey={dk.key} fill={dk.color} name={dk.name} />
            ))}
          </BarChart>
        );
      case "scatter":
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} name={xAxisLabel} label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -5 } : undefined} />
            <YAxis dataKey={dataKeys[0]?.key} name={yAxisLabel} label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={data} fill={dataKeys[0]?.color || "#2563eb"} name={dataKeys[0]?.name} />
          </ScatterChart>
        );
      case "pie":
        const COLORS = dataKeys.map(dk => dk.color);
        return (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine outerRadius={120} fill="#8884d8" dataKey={dataKeys[0]?.key || "value"} nameKey={xAxisKey}
              label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      case "radar":
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={xAxisKey} />
            <PolarRadiusAxis />
            {dataKeys.map(dk => (
              <Radar key={dk.key} name={dk.name} dataKey={dk.key} stroke={dk.color} fill={dk.color} fillOpacity={0.3} />
            ))}
            <Legend />
            <Tooltip />
          </RadarChart>
        );
      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -5 } : undefined} />
            <YAxis label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined} />
            <Tooltip />
            <Legend />
            {dataKeys.map(dk => (
              <Area key={dk.key} type="monotone" dataKey={dk.key} stroke={dk.color} fill={dk.color} fillOpacity={0.3} name={dk.name} />
            ))}
          </AreaChart>
        );
      default:
        return <div className="text-center text-muted-foreground py-8">不支持的图表类型</div>;
    }
  };

  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.png`;
      link.href = url;
      link.click();
      toast.success('图表已导出为PNG');
    } catch (error) {
      toast.error('导出失败');
      console.error(error);
    }
  };

  const handleExportSVG = () => {
    toast.info('SVG导出功能开发中');
  };

  return (
    <Card ref={chartRef}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-center">{title}</CardTitle>
            {config.description && <CardDescription className="text-center mt-2">{config.description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPNG}>
              <Download className="h-4 w-4 mr-1" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportSVG}>
              <ImageIcon className="h-4 w-4 mr-1" />
              SVG
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function ChartTools() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [csvData, setCsvData] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionOnly, setDescriptionOnly] = useState("");
  const [selectedPaperId, setSelectedPaperId] = useState<number | null>(null);
  const [generatedChart, setGeneratedChart] = useState<ChartConfig | null>(null);
  const [showChartList, setShowChartList] = useState(false);

  const { data: papers } = trpc.paper.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: chartList, refetch: refetchCharts } = trpc.chart.list.useQuery(
    { paperId: selectedPaperId! },
    { enabled: isAuthenticated && selectedPaperId !== null && showChartList }
  );

  const deleteChartMutation = trpc.chart.delete.useMutation({
    onSuccess: () => {
      toast.success('图表已删除');
      refetchCharts();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const generateFromCSVMutation = trpc.chart.generateFromCSV.useMutation({
    onSuccess: (data) => {
      toast.success("图表生成成功！");
      setGeneratedChart(data.config);
      refetchCharts();
    },
    onError: (error) => {
      toast.error(`生成失败: ${error.message}`);
    },
  });

  const generateFromDescMutation = trpc.chart.generateFromDescription.useMutation({
    onSuccess: (data) => {
      toast.success("图表生成成功！");
      setGeneratedChart(data.config);
      refetchCharts();
    },
    onError: (error) => {
      toast.error(`生成失败: ${error.message}`);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>需要登录</CardTitle>
            <CardDescription>请先登录以使用图表工具</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleGenerateFromCSV = () => {
    if (!selectedPaperId) {
      toast.error("请先选择关联的论文");
      return;
    }
    if (!csvData.trim()) {
      toast.error("请输入CSV数据");
      return;
    }
    generateFromCSVMutation.mutate({
      paperId: selectedPaperId,
      csvData: csvData.trim(),
      description: description || "请自动选择合适的图表类型",
    });
  };

  const handleGenerateFromDescription = () => {
    if (!selectedPaperId) {
      toast.error("请先选择关联的论文");
      return;
    }
    if (!descriptionOnly.trim()) {
      toast.error("请输入图表描述");
      return;
    }
    generateFromDescMutation.mutate({
      paperId: selectedPaperId,
      description: descriptionOnly.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI学术论文写作平台
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/")}>首页</Button>
            <Button variant="ghost" onClick={() => setLocation("/papers")}>我的论文</Button>
            <Button variant="ghost" onClick={() => setLocation("/knowledge")}>知识库</Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">图表生成工具</h2>
          <p className="text-muted-foreground">输入数据或描述，AI自动生成符合学术规范的图表</p>
        </div>

        {/* Paper selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Label className="text-base">关联论文</Label>
            <Select value={selectedPaperId?.toString() || ""} onValueChange={v => setSelectedPaperId(parseInt(v))}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="选择要关联的论文" />
              </SelectTrigger>
              <SelectContent>
                {papers?.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Tabs defaultValue="csv" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="csv">CSV数据生成</TabsTrigger>
            <TabsTrigger value="description">描述生成</TabsTrigger>
          </TabsList>

          <TabsContent value="csv">
            <Card>
              <CardHeader>
                <CardTitle>从CSV数据生成图表</CardTitle>
                <CardDescription>输入CSV格式数据，AI自动选择最佳图表类型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>CSV数据</Label>
                  <Textarea
                    value={csvData}
                    onChange={e => setCsvData(e.target.value)}
                    placeholder={"年份,销售额,增长率\n2020,100,5.2\n2021,120,20.0\n2022,150,25.0\n2023,180,20.0"}
                    className="min-h-[200px] font-mono text-sm mt-2"
                  />
                </div>
                <div>
                  <Label>图表描述（可选）</Label>
                  <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="例如：展示近4年销售额增长趋势的折线图"
                    className="mt-2"
                  />
                </div>
                <Button onClick={handleGenerateFromCSV} disabled={generateFromCSVMutation.isPending} className="w-full">
                  {generateFromCSVMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</>
                  ) : (
                    <><BarChart3 className="mr-2 h-4 w-4" />生成图表</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="description">
            <Card>
              <CardHeader>
                <CardTitle>从描述生成图表</CardTitle>
                <CardDescription>用自然语言描述需要的图表，AI自动生成数据和可视化</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>图表描述</Label>
                  <Textarea
                    value={descriptionOnly}
                    onChange={e => setDescriptionOnly(e.target.value)}
                    placeholder="例如：生成一个对比不同机器学习算法（SVM、随机森林、神经网络、XGBoost）在准确率、召回率和F1分数三个指标上表现的雷达图"
                    className="min-h-[150px] mt-2"
                  />
                </div>
                <Button onClick={handleGenerateFromDescription} disabled={generateFromDescMutation.isPending} className="w-full">
                  {generateFromDescMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />AI生成图表</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Chart List */}
        {selectedPaperId && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">已生成的图表</h3>
              <Button variant="outline" onClick={() => { setShowChartList(!showChartList); if (!showChartList) refetchCharts(); }}>
                {showChartList ? '隐藏列表' : '查看列表'}
              </Button>
            </div>
            {showChartList && chartList && chartList.length > 0 && (
              <div className="grid gap-4">
                {chartList.map((chart) => (
                  <Card key={chart.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{chart.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {chart.chartType} · {new Date(chart.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteChartMutation.mutate({ id: chart.id })}
                          disabled={deleteChartMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ChartPreview
                        config={{
                          chartType: chart.chartType,
                          title: chart.title,
                          data: chart.dataSource,
                          xAxisKey: chart.chartConfig.xAxisKey,
                          dataKeys: chart.chartConfig.dataKeys,
                          xAxisLabel: chart.chartConfig.xAxisLabel,
                          yAxisLabel: chart.chartConfig.yAxisLabel,
                          description: chart.description || undefined,
                        }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {showChartList && chartList && chartList.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  还没有生成任何图表
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Chart Preview */}
        {generatedChart && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">最新生成结果</h3>
            <ChartPreview config={generatedChart} />
          </div>
        )}
      </main>
    </div>
  );
}
