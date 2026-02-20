import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { BarChart3, Loader2, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
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

function ChartPreview({ config }: { config: ChartConfig }) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
        {config.description && <CardDescription className="text-center">{config.description}</CardDescription>}
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

  const { data: papers } = trpc.paper.list.useQuery(undefined, { enabled: isAuthenticated });

  const generateFromCSVMutation = trpc.chart.generateFromCSV.useMutation({
    onSuccess: (data) => {
      toast.success("图表生成成功！");
      setGeneratedChart(data.config);
    },
    onError: (error) => {
      toast.error(`生成失败: ${error.message}`);
    },
  });

  const generateFromDescMutation = trpc.chart.generateFromDescription.useMutation({
    onSuccess: (data) => {
      toast.success("图表生成成功！");
      setGeneratedChart(data.config);
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

        {/* Chart Preview */}
        {generatedChart && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">生成结果</h3>
            <ChartPreview config={generatedChart} />
          </div>
        )}
      </main>
    </div>
  );
}
