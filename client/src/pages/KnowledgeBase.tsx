import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { BookOpen, FileText, Loader2, MessageSquare, Plus, Search, Trash2, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function KnowledgeBase() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [chatDocId, setChatDocId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false);
  const [analyzeDocId, setAnalyzeDocId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: documents, isLoading } = trpc.knowledge.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const uploadMutation = trpc.knowledge.upload.useMutation({
    onSuccess: (data) => {
      toast.success("文件上传成功！");
      setAnalyzeDocId(data.id);
      setShowAnalyzeDialog(true);
      utils.knowledge.list.invalidate();
    },
    onError: (error) => {
      toast.error(`上传失败: ${error.message}`);
    },
  });

  const analyzeMutation = trpc.knowledge.analyze.useMutation({
    onSuccess: () => {
      toast.success("文档分析完成！");
      setShowAnalyzeDialog(false);
      setExtractedText("");
      utils.knowledge.list.invalidate();
    },
    onError: (error) => {
      toast.error(`分析失败: ${error.message}`);
    },
  });

  const chatMutation = trpc.knowledge.chat.useMutation({
    onSuccess: (data) => {
      setChatMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    },
    onError: (error) => {
      toast.error(`对话失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      toast.success("文档已删除");
      utils.knowledge.list.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("文件大小不能超过20MB");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadMutation.mutate({
          fileName: file.name,
          fileContent: base64,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = () => {
    if (!analyzeDocId || !extractedText.trim()) {
      toast.error("请输入文档的文本内容");
      return;
    }
    analyzeMutation.mutate({
      documentId: analyzeDocId,
      extractedText: extractedText.trim(),
    });
  };

  const handleSendChat = () => {
    if (!chatDocId || !chatInput.trim()) return;
    const newMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    setChatMessages(prev => [...prev, newMsg]);
    chatMutation.mutate({
      documentId: chatDocId,
      question: chatInput.trim(),
      chatHistory: chatMessages,
    });
    setChatInput("");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/5">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>需要登录</CardTitle>
            <CardDescription>请先登录以使用知识库</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Button variant="ghost" onClick={() => setLocation("/dashboard")}>仪表板</Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">知识库</h2>
            <p className="text-muted-foreground">上传文献，AI辅助阅读和内容生成</p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading || uploadMutation.isPending}>
              {isUploading || uploadMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />上传中...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />上传文献</>
              )}
            </Button>
          </div>
        </div>

        {/* Analyze Dialog */}
        <Dialog open={showAnalyzeDialog} onOpenChange={setShowAnalyzeDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>文档内容提取</DialogTitle>
              <DialogDescription>
                请将文档的文本内容粘贴到下方，AI将自动分析并提取关键信息
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={extractedText}
              onChange={e => setExtractedText(e.target.value)}
              placeholder="粘贴文档文本内容..."
              className="min-h-[300px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAnalyzeDialog(false)}>取消</Button>
              <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
                {analyzeMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />分析中...</> : "开始分析"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Chat Dialog */}
        <Dialog open={chatDocId !== null} onOpenChange={(open) => { if (!open) { setChatDocId(null); setChatMessages([]); } }}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>文献对话</DialogTitle>
              <DialogDescription>
                基于文献内容进行智能问答
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="输入问题..."
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
              />
              <Button onClick={handleSendChat} disabled={chatMutation.isPending || !chatInput.trim()}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Document List */}
        {!documents || documents.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">知识库为空</h3>
              <p className="text-muted-foreground mb-6">上传PDF文献开始使用RAG功能</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />上传文献
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <Card key={doc.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{doc.fileName}</CardTitle>
                      <CardDescription className="mt-1">
                        {(doc.fileSize / 1024).toFixed(1)} KB
                        {doc.status === "ready" && " · 已分析"}
                        {doc.status === "processing" && " · 处理中"}
                        {doc.status === "failed" && " · 分析失败"}
                      </CardDescription>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      doc.status === "ready" ? "bg-green-100 text-green-800" :
                      doc.status === "processing" ? "bg-blue-100 text-blue-800" :
                      doc.status === "failed" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {doc.status === "ready" ? "就绪" : doc.status === "processing" ? "处理中" : doc.status === "failed" ? "失败" : "上传中"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {doc.summary && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{doc.summary}</p>
                  )}
                  {doc.metadata?.keywords && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doc.metadata.keywords.slice(0, 5).map((kw: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-secondary/50 rounded text-xs">{kw}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {doc.status === "ready" && (
                      <Button size="sm" variant="outline" onClick={() => setChatDocId(doc.id)}>
                        <MessageSquare className="mr-1 h-3 w-3" />对话
                      </Button>
                    )}
                    {doc.status !== "ready" && doc.status !== "processing" && (
                      <Button size="sm" variant="outline" onClick={() => { setAnalyzeDocId(doc.id); setShowAnalyzeDialog(true); }}>
                        <Search className="mr-1 h-3 w-3" />分析
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate({ id: doc.id })}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
