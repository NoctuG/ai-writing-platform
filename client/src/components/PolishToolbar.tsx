import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PolishToolbarProps {
  selectedText: string;
  onReplace: (newText: string) => void;
}

export default function PolishToolbar({ selectedText, onReplace }: PolishToolbarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const polishMutation = trpc.polish.text.useMutation({
    onSuccess: () => {
      setShowSuggestions(true);
    },
    onError: (error: any) => {
      toast.error(`润色失败: ${error.message}`);
    },
  });

  const handlePolish = () => {
    if (!selectedText || selectedText.trim().length === 0) {
      toast.error("请先选中要润色的文本");
      return;
    }
    polishMutation.mutate({ text: selectedText });
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("已复制到剪贴板");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error("复制失败");
    }
  };

  const handleReplace = (text: string) => {
    onReplace(text);
    setShowSuggestions(false);
    toast.success("已替换文本");
  };

  return (
    <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePolish}
          disabled={polishMutation.isPending || !selectedText}
        >
          {polishMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              润色中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              AI润色
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] max-h-[500px] overflow-y-auto" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">原文</h4>
            <div className="p-3 bg-muted rounded-md text-sm">
              {selectedText}
            </div>
          </div>

          <Separator />

          {polishMutation.data && polishMutation.data.suggestions && (
            <div>
              <h4 className="font-semibold mb-3">润色建议</h4>
              <div className="space-y-3">
                {polishMutation.data.suggestions.map((suggestion: any, index: number) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">建议 {index + 1}</CardTitle>
                        <Badge variant="secondary">{suggestion.type}</Badge>
                      </div>
                      {suggestion.reason && (
                        <CardDescription className="text-xs">
                          {suggestion.reason}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-accent/50 rounded-md text-sm">
                        {suggestion.text}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(suggestion.text, index)}
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              复制
                            </>
                          )}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReplace(suggestion.text)}
                        >
                          替换原文
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
