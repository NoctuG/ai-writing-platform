import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <Card className="max-w-md w-full border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">支付成功！</CardTitle>
          <CardDescription>
            感谢您的购买，您的订单已成功处理
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            您现在可以开始使用所有高级功能了
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setLocation("/")} className="w-full">
              返回首页
            </Button>
            <Button onClick={() => setLocation("/papers")} variant="outline" className="w-full">
              查看我的论文
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
