import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function PaymentCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <Card className="max-w-md w-full border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">支付已取消</CardTitle>
          <CardDescription>
            您已取消支付流程
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            如果您在支付过程中遇到问题，请联系客服
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setLocation("/pricing")} className="w-full">
              重新选择方案
            </Button>
            <Button onClick={() => setLocation("/")} variant="outline" className="w-full">
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
