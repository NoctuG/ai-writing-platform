import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/fluent/card";
import { Button } from "@/components/fluent/button";
import { motion } from "framer-motion";
import { BarChart3, Sparkles } from "lucide-react";

export type DistributionDataItem = {
  id: string;
  label: string;
  count: number;
};

type DistributionChartCardProps = {
  title: string;
  description: string;
  items: DistributionDataItem[];
  total?: number;
  tone?: "primary" | "secondary";
  enableAnimation?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
};

const toneStyles = {
  primary: {
    track: "bg-primary/10",
    bar: "bg-primary",
  },
  secondary: {
    track: "bg-secondary/20",
    bar: "bg-secondary",
  },
} as const;

export function DistributionChartCard({
  title,
  description,
  items,
  total,
  tone = "primary",
  enableAnimation = true,
  emptyTitle = "暂无分布数据",
  emptyDescription = "先创建几篇论文或添加引用，稍后这里会展示趋势分析。",
  emptyActionLabel = "去创建内容",
  onEmptyAction,
}: DistributionChartCardProps) {
  const resolvedTotal = total ?? items.reduce((sum, item) => sum + item.count, 0);
  const style = toneStyles[tone];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item, index) => {
              const percentage = (item.count / (resolvedTotal || 1)) * 100;

              return (
                <motion.div
                  key={item.id}
                  className="flex items-center justify-between"
                  initial={enableAnimation ? { opacity: 0, y: 10 } : false}
                  animate={enableAnimation ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-32 h-2 rounded-full overflow-hidden ${style.track}`}>
                      <motion.div
                        className={`h-full rounded-full ${style.bar}`}
                        initial={enableAnimation ? { width: 0 } : false}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.08 }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{item.count}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center bg-gradient-to-br from-muted/30 to-background">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="font-medium">{emptyTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">{emptyDescription}</p>
            {onEmptyAction ? (
              <Button className="mt-4" variant="outline" onClick={onEmptyAction}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {emptyActionLabel}
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
