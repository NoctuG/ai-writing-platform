import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Languages, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const languages = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

const domains = [
  { value: "general", label: "通用" },
  { value: "computer_science", label: "计算机科学" },
  { value: "medicine", label: "医学" },
  { value: "law", label: "法学" },
  { value: "economics", label: "经济学" },
  { value: "engineering", label: "工程学" },
  { value: "natural_science", label: "自然科学" },
  { value: "social_science", label: "社会科学" },
];

export default function TranslationTools() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("zh");
  const [targetLang, setTargetLang] = useState("en");
  const [domain, setDomain] = useState("general");
  const [terminology, setTerminology] = useState<{ source: string; target: string }[]>([]);

  const translateMutation = trpc.translation.translate.useMutation({
    onSuccess: (data) => {
      setTranslatedText(data.translatedText);
      setTerminology(data.terminology);
      toast.success("翻译完成！");
    },
    onError: (error) => {
      toast.error(`翻译失败: ${error.message}`);
    },
  });

  const polishMutation = trpc.translation.polish.useMutation({
    onSuccess: (data) => {
      setTranslatedText(data.polishedText);
      toast.success("润色完成！");
    },
    onError: (error) => {
      toast.error(`润色失败: ${error.message}`);
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
            <CardDescription>请先登录以使用翻译工具</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleTranslate = () => {
    if (!sourceText.trim()) {
      toast.error("请输入要翻译的文本");
      return;
    }
    translateMutation.mutate({
      text: sourceText.trim(),
      sourceLang,
      targetLang,
      domain: domain as any,
    });
  };

  const handlePolish = () => {
    if (!translatedText.trim()) {
      toast.error("没有可润色的文本");
      return;
    }
    polishMutation.mutate({
      text: translatedText.trim(),
      language: targetLang,
      domain: domain as any,
    });
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
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
          <h2 className="text-3xl font-bold mb-2">学术翻译工具</h2>
          <p className="text-muted-foreground">专业学术级翻译，精准术语，母语级润色</p>
        </div>

        {/* Language and Domain Selection */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <Label>源语言</Label>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {languages.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="icon" className="mt-5" onClick={swapLanguages}>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-[150px]">
                <Label>目标语言</Label>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {languages.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label>学术领域</Label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {domains.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Translation Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">原文</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
                placeholder="输入要翻译的学术文本..."
                className="min-h-[300px]"
              />
              <div className="mt-3 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{sourceText.length} 字符</span>
                <Button onClick={handleTranslate} disabled={translateMutation.isPending}>
                  {translateMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />翻译中...</>
                  ) : (
                    <><Languages className="mr-2 h-4 w-4" />翻译</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">译文</CardTitle>
                {translatedText && (
                  <Button size="sm" variant="outline" onClick={handlePolish} disabled={polishMutation.isPending}>
                    {polishMutation.isPending ? (
                      <><Loader2 className="mr-2 h-3 w-3 animate-spin" />润色中...</>
                    ) : (
                      <><Sparkles className="mr-2 h-3 w-3" />母语级润色</>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={translatedText}
                onChange={e => setTranslatedText(e.target.value)}
                placeholder="翻译结果将显示在这里..."
                className="min-h-[300px]"
              />
              <div className="mt-3">
                <span className="text-sm text-muted-foreground">{translatedText.length} 字符</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terminology Table */}
        {terminology.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>术语对照表</CardTitle>
              <CardDescription>翻译过程中涉及的关键学术术语</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {terminology.map((term, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                    <span className="text-sm font-medium">{term.source}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-primary">{term.target}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
