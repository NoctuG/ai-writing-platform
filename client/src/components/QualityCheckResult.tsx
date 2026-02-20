import { Button } from "@/components/fluent/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/fluent/card";
import { Progress } from "@/components/fluent/progress";
import { Badge } from "@/components/fluent/badge";
import { Separator } from "@/components/fluent/separator";
import { ScrollArea } from "@/components/fluent/scroll-area";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, TrendingUp } from "lucide-react";

interface QualityCheckResultProps {
  result: {
    overallScore: number;
    plagiarismScore: number | null;
    grammarScore: number | null;
    academicStyleScore: number | null;
    structureScore: number | null;
    issues: any;
    suggestions: any;
  };
}

export default function QualityCheckResult({ result }: QualityCheckResultProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "优秀";
    if (score >= 75) return "良好";
    if (score >= 60) return "及格";
    return "需改进";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "low":
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      high: "严重",
      medium: "中等",
      low: "轻微",
    };
    return labels[severity] || severity;
  };

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      plagiarism: "查重",
      grammar: "语法",
      academic_style: "学术规范",
      structure: "结构",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            总体评分
          </CardTitle>
          <CardDescription>论文质量综合评分</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(result.overallScore)}`}>
                {result.overallScore}
              </div>
              <div className="text-lg text-muted-foreground mt-2">
                {getScoreLabel(result.overallScore)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <Card>
        <CardHeader>
          <CardTitle>详细评分</CardTitle>
          <CardDescription>各项指标的详细得分</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">查重检测</span>
              <span className={`text-sm font-bold ${getScoreColor(result.plagiarismScore || 0)}`}>
                {result.plagiarismScore || 0} 分
              </span>
            </div>
            <Progress value={result.plagiarismScore || 0} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">语法规范</span>
              <span className={`text-sm font-bold ${getScoreColor(result.grammarScore || 0)}`}>
                {result.grammarScore || 0} 分
              </span>
            </div>
            <Progress value={result.grammarScore || 0} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">学术风格</span>
              <span className={`text-sm font-bold ${getScoreColor(result.academicStyleScore || 0)}`}>
                {result.academicStyleScore || 0} 分
              </span>
            </div>
            <Progress value={result.academicStyleScore || 0} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">结构完整性</span>
              <span className={`text-sm font-bold ${getScoreColor(result.structureScore || 0)}`}>
                {result.structureScore || 0} 分
              </span>
            </div>
            <Progress value={result.structureScore || 0} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {result.issues && result.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>发现的问题</CardTitle>
            <CardDescription>按严重程度分类的问题列表</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {result.issues.map((issue: any, index: number) => (
                  <div key={index} className="border-l-4 border-l-muted pl-4 py-2">
                    <div className="flex items-start gap-2 mb-2">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{getIssueTypeLabel(issue.type)}</Badge>
                          <Badge variant={issue.severity === "high" ? "destructive" : "secondary"}>
                            {getSeverityLabel(issue.severity)}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{issue.message}</p>
                        {issue.suggestion && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">建议：</span>
                            {issue.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {result.suggestions && result.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>改进建议</CardTitle>
            <CardDescription>提升论文质量的具体建议</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
