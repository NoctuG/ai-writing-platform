import { Button } from "@/components/fluent/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/fluent/card";
import { Input } from "@/components/fluent/input";
import { Label } from "@/components/fluent/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/fluent/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/fluent/dialog";
import { ScrollArea } from "@/components/fluent/scroll-area";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, Search, Trash2, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ReferenceManagerProps {
  paperId: number;
}

const citationFormatLabels: Record<string, string> = {
  gbt7714: "GB/T 7714",
  apa: "APA",
  mla: "MLA",
  chicago: "Chicago",
};

const documentTypeLabels: Record<string, string> = {
  journal: "期刊",
  book: "图书",
  thesis: "学位论文",
  conference: "会议论文",
  report: "报告",
  standard: "标准",
  patent: "专利",
  web: "网络文献",
};

const documentTypeCodeMap: Record<string, string> = {
  journal: "J",
  book: "M",
  thesis: "D",
  conference: "C",
  report: "R",
  standard: "S",
  patent: "P",
  web: "EB/OL",
};

export default function ReferenceManager({ paperId }: ReferenceManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("gbt7714");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const utils = trpc.useUtils();

  const { data: references, isLoading } = trpc.reference.list.useQuery({
    paperId,
  });

  const searchMutation = trpc.reference.search.useMutation({
    onSuccess: () => {
      toast.success("文献搜索成功");
    },
    onError: error => {
      toast.error(`搜索失败: ${error.message}`);
    },
  });

  const addMutation = trpc.reference.add.useMutation({
    onSuccess: () => {
      utils.reference.list.invalidate({ paperId });
      toast.success("文献添加成功");
      setShowAddDialog(false);
    },
    onError: error => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.reference.delete.useMutation({
    onSuccess: () => {
      utils.reference.list.invalidate({ paperId });
      toast.success("文献删除成功");
    },
    onError: error => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("请输入搜索关键词");
      return;
    }
    await searchMutation.mutateAsync({ paperId, query: searchQuery });
  };

  const handleCopyFormatted = async (ref: any) => {
    try {
      const authors = Array.isArray(ref.authors)
        ? ref.authors
        : String(ref.authors || "")
            .split(",")
            .map((a: string) => a.trim())
            .filter(Boolean);
      let formatted = "";

      if (selectedFormat === "gbt7714") {
        const authorStr =
          authors.length > 3
            ? `${authors.slice(0, 3).join(", ")}, 等`
            : authors.join(", ");
        const documentCode =
          documentTypeCodeMap[ref.documentType || "journal"] || "J";
        formatted = `${authorStr}. ${ref.title}[${documentCode}]. `;
        if (ref.journal) formatted += `${ref.journal}, `;
        if (ref.year) formatted += `${ref.year}`;
        if (ref.volume) formatted += `, ${ref.volume}`;
        if (ref.issue) formatted += `(${ref.issue})`;
        if (ref.pages) formatted += `: ${ref.pages}`;
        formatted += ".";
      } else if (selectedFormat === "apa") {
        formatted = `${authors.join(", ")} (${ref.year}). ${ref.title}. `;
        if (ref.journal) {
          formatted += `${ref.journal}`;
          if (ref.volume) formatted += `, ${ref.volume}`;
          if (ref.issue) formatted += `(${ref.issue})`;
          if (ref.pages) formatted += `, ${ref.pages}`;
        }
        formatted += ".";
      }

      await navigator.clipboard.writeText(formatted);
      toast.success("已复制到剪贴板");
    } catch (error: any) {
      toast.error(`复制失败: ${error.message}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          参考文献管理
        </h3>

        {/* Search */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="搜索学术文献..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searchMutation.isPending}>
              {searchMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Format Selector */}
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">引用格式:</Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(citationFormatLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Reference Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                手动添加文献
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>添加参考文献</DialogTitle>
                <DialogDescription>手动输入文献信息</DialogDescription>
              </DialogHeader>
              <AddReferenceForm
                paperId={paperId}
                onAdd={data => addMutation.mutate(data)}
                isPending={addMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reference List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : references && references.length > 0 ? (
            references.map(ref => (
              <Card
                key={ref.id}
                className="hover:bg-accent/50 transition-colors"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {ref.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {ref.authors} • {ref.year}
                    {ref.journal && ` • ${ref.journal}`}
                    {ref.documentType &&
                      ` • ${documentTypeLabels[ref.documentType] || ref.documentType}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyFormatted(ref)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      复制引用
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate({ id: ref.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                还没有添加参考文献
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                搜索或手动添加文献以开始
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface AddReferenceFormProps {
  paperId: number;
  onAdd: (data: any) => void;
  isPending: boolean;
}

function AddReferenceForm({
  paperId,
  onAdd,
  isPending,
}: AddReferenceFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    authors: "",
    year: new Date().getFullYear(),
    journal: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    documentType: "journal",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      paperId,
      title: formData.title,
      authors: formData.authors,
      year: formData.year,
      journal: formData.journal || undefined,
      volume: formData.volume || undefined,
      issue: formData.issue || undefined,
      pages: formData.pages || undefined,
      doi: formData.doi || undefined,
      documentType: formData.documentType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="title">标题 *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="authors">作者 *</Label>
          <Input
            id="authors"
            placeholder="多个作者用逗号分隔"
            value={formData.authors}
            onChange={e =>
              setFormData({ ...formData, authors: e.target.value })
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="year">年份 *</Label>
          <Input
            id="year"
            type="number"
            value={formData.year}
            onChange={e =>
              setFormData({ ...formData, year: parseInt(e.target.value) })
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="documentType">文献类型</Label>
          <Select
            value={formData.documentType}
            onValueChange={value =>
              setFormData({ ...formData, documentType: value })
            }
          >
            <SelectTrigger id="documentType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="journal">期刊</Label>
          <Input
            id="journal"
            value={formData.journal}
            onChange={e =>
              setFormData({ ...formData, journal: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="volume">卷</Label>
          <Input
            id="volume"
            value={formData.volume}
            onChange={e => setFormData({ ...formData, volume: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="issue">期</Label>
          <Input
            id="issue"
            value={formData.issue}
            onChange={e => setFormData({ ...formData, issue: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="pages">页码</Label>
          <Input
            id="pages"
            placeholder="例如: 123-130"
            value={formData.pages}
            onChange={e => setFormData({ ...formData, pages: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="doi">DOI</Label>
          <Input
            id="doi"
            value={formData.doi}
            onChange={e => setFormData({ ...formData, doi: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              添加中...
            </>
          ) : (
            "添加文献"
          )}
        </Button>
      </div>
    </form>
  );
}
