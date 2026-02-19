import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: products, isLoading } = trpc.payment.getProducts.useQuery();
  const { data: subscriptionStatus } = trpc.payment.getSubscriptionStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCheckoutMutation = trpc.payment.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("正在跳转到支付页面...");
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message || "创建支付会话失败");
    },
  });

  const handlePurchase = (productId: string) => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      window.location.href = getLoginUrl();
      return;
    }

    createCheckoutMutation.mutate({ productId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  const oneTimeProducts = products?.filter((p) => p.type === "one_time") || [];
  const subscriptionProducts = products?.filter((p) => p.type === "subscription") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex justify-between items-center">
          <h1
            className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent cursor-pointer"
            onClick={() => setLocation("/")}
          >
            AI学术论文写作平台
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              返回首页
            </Button>
            {isAuthenticated && (
              <Button variant="ghost" onClick={() => setLocation("/papers")}>
                我的论文
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">选择适合您的方案</h1>
            <p className="text-lg text-muted-foreground">
              灵活的定价选项，满足不同需求
            </p>
            {subscriptionStatus?.hasActiveSubscription && (
              <Badge variant="default" className="text-base px-4 py-2">
                当前订阅状态：
                {subscriptionStatus.status === "active" && "活跃"}
                {subscriptionStatus.endDate && ` (到期时间: ${new Date(subscriptionStatus.endDate).toLocaleDateString()})`}
              </Badge>
            )}
          </div>

          {/* 订阅方案 */}
          {subscriptionProducts.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center">订阅方案</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subscriptionProducts.map((product) => (
                  <Card key={product.id} className="border-2 hover:border-primary/50 transition-colors relative">
                    {product.interval === "year" && (
                      <div className="absolute -top-3 right-4">
                        <Badge variant="default" className="bg-gradient-to-r from-primary to-secondary">
                          推荐
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl">{product.name}</CardTitle>
                      <CardDescription>{product.description}</CardDescription>
                      <div className="pt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold">¥{(product.price / 100).toFixed(2)}</span>
                          <span className="text-muted-foreground">
                            /{product.interval === "month" ? "月" : "年"}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => handlePurchase(product.id)}
                        disabled={createCheckoutMutation.isPending || subscriptionStatus?.hasActiveSubscription}
                      >
                        {subscriptionStatus?.hasActiveSubscription ? (
                          "已订阅"
                        ) : createCheckoutMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            处理中...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            立即订阅
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 单次购买 */}
          {oneTimeProducts.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center">单次购买</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {oneTimeProducts.map((product) => (
                  <Card key={product.id} className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle>{product.name}</CardTitle>
                      <CardDescription>{product.description}</CardDescription>
                      <div className="pt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">¥{(product.price / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handlePurchase(product.id)}
                        disabled={createCheckoutMutation.isPending}
                      >
                        {createCheckoutMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            处理中...
                          </>
                        ) : (
                          "立即购买"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
