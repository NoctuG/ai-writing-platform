import { useAuth } from "@/_core/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageHeader } from "@/components/fluent/PageHeader";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Body1,
  Button,
  Card,
  Field,
  makeStyles,
  shorthands,
  Spinner,
  Subtitle1,
  Text,
  Title1,
  tokens,
  Dropdown,
  Option,
  Input,
  mergeClasses,
} from "@fluentui/react-components";
import {
  BarChart3,
  BookOpen,
  Database,
  FileCode,
  FileText,
  FolderOpen,
  GraduationCap,
  Languages,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const paperTypes = [
  { value: "graduation", label: "毕业论文", icon: GraduationCap, description: "本科、硕士、博士毕业论文" },
  { value: "journal", label: "期刊论文", icon: FileText, description: "学术期刊投稿论文" },
  { value: "proposal", label: "开题报告", icon: BookOpen, description: "研究课题开题报告" },
  { value: "professional", label: "职称论文", icon: Sparkles, description: "职称评审论文" },
] as const;

const features = [
  {
    title: "RAG知识库",
    description: "上传PDF文献，AI基于文献内容生成论文，减少幻觉，提高准确性",
    icon: Database,
    href: "/knowledge",
  },
  {
    title: "数据可视化",
    description: "输入CSV数据或文字描述，AI自动生成折线图、柱状图、散点图等学术图表",
    icon: BarChart3,
    href: "/charts",
  },
  {
    title: "学术翻译",
    description: "支持中英双语对照翻译，精准学术术语，母语级润色",
    icon: Languages,
    href: "/translation",
  },
  {
    title: "LaTeX导出",
    description: "支持IEEE、Nature、Elsevier等期刊模板，一键导出.tex源码",
    icon: FileCode,
    href: null,
  },
  {
    title: "项目管理",
    description: "文件夹分组、标签管理、回收站，系统化管理您的研究论文",
    icon: FolderOpen,
    href: "/papers",
  },
  {
    title: "智能写作",
    description: "AI大纲生成、全文撰写、质量检测、参考文献管理、文本润色",
    icon: Sparkles,
    href: null,
  },
] as const;

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL),
  },
  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    maxWidth: "1120px",
    marginLeft: "auto",
    marginRight: "auto",
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXL,
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
    textAlign: "center",
  },
  heroSubtitle: {
    color: tokens.colorNeutralForeground2,
  },
  formCard: {
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow8,
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalL,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalL,
  },
  sectionTitle: {
    textAlign: "center",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  featureCard: {
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
    minHeight: "180px",
    transitionProperty: "transform, box-shadow, border-color, background-color",
    transitionDuration: "200ms",
    transitionTimingFunction: "ease",
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: "translateY(-2px)",
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
    ':active': {
      transform: "translateY(0)",
      boxShadow: tokens.shadow2,
      backgroundColor: tokens.colorNeutralBackground1Pressed,
    },
    ':focus-visible': {
      outlineStyle: "solid",
      outlineWidth: "2px",
      outlineColor: tokens.colorStrokeFocus2,
      outlineOffset: "2px",
    },
  },
  featureCardInteractive: {
    cursor: "pointer",
  },
  iconWrap: {
    width: "40px",
    height: "40px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  featureDescription: {
    color: tokens.colorNeutralForeground2,
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  userText: {
    color: tokens.colorNeutralForeground2,
    marginLeft: tokens.spacingHorizontalXS,
  },
});

export default function Home() {
  const styles = useStyles();
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<string>("");
  const [title, setTitle] = useState("");

  const createPaperMutation = trpc.paper.create.useMutation({
    onSuccess: (data) => {
      toast.success("论文创建成功，开始生成大纲...");
      setLocation(`/paper/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "创建论文失败");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !title.trim()) {
      toast.error("请选择论文类型并输入标题");
      return;
    }
    createPaperMutation.mutate({
      type: selectedType as "graduation" | "journal" | "proposal" | "professional",
      title: title.trim(),
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner label="加载中..." size="large" />
      </div>
    );
  }

  const headerActions = (
    <div className={styles.navActions}>
      <ThemeToggle />
      {isAuthenticated ? (
        <>
          <Button appearance="subtle" onClick={() => setLocation("/dashboard")}>仪表板</Button>
          <Button appearance="subtle" onClick={() => setLocation("/papers")}>我的论文</Button>
          <Button appearance="subtle" onClick={() => setLocation("/knowledge")}>知识库</Button>
          <Button appearance="subtle" onClick={() => setLocation("/charts")}>图表工具</Button>
          <Button appearance="subtle" onClick={() => setLocation("/translation")}>翻译</Button>
          <Text size={200} className={styles.userText}>欢迎，{user?.name || user?.email}</Text>
        </>
      ) : (
        <Button appearance="primary" onClick={() => (window.location.href = getLoginUrl())}>登录开始使用</Button>
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <PageHeader
          eyebrow="AI 学术工作站"
          title="AI学术论文写作平台"
          subtitle="一站式专业学术科研工作站：RAG知识库、智能写作、数据可视化、学术翻译"
          actions={headerActions}
        />

        <section className={styles.hero}>
          <Title1>{isAuthenticated ? "开始创作您的学术论文" : "覆盖科研全流程的智能工具箱"}</Title1>
          <Subtitle1 className={styles.heroSubtitle}>
            {isAuthenticated
              ? "选择论文类型，输入标题，AI 将为您生成完整的论文大纲和内容"
              : "统一 Fluent 体验，帮助您高效完成选题、写作、翻译与成果整理。"}
          </Subtitle1>
        </section>

        {isAuthenticated ? (
          <Card className={styles.formCard}>
            <Title1>创建新论文</Title1>
            <Body1 className={styles.heroSubtitle}>请选择论文类型并输入您的论文标题</Body1>
            <form onSubmit={handleSubmit} className={styles.form}>
              <Field label="论文类型" required>
                <Dropdown
                  value={selectedType ? paperTypes.find((type) => type.value === selectedType)?.label : undefined}
                  placeholder="请选择论文类型"
                  selectedOptions={selectedType ? [selectedType] : []}
                  onOptionSelect={(_, data) => setSelectedType(data.optionValue ?? "")}
                >
                  {paperTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Option key={type.value} value={type.value} text={type.label}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: tokens.spacingHorizontalXS }}>
                          <Icon size={16} />
                          {type.label}
                        </span>
                      </Option>
                    );
                  })}
                </Dropdown>
              </Field>

              <Field label="论文标题" required>
                <Input
                  placeholder="请输入您的论文标题"
                  value={title}
                  onChange={(_, data) => setTitle(data.value)}
                />
              </Field>

              <Button appearance="primary" type="submit" disabled={createPaperMutation.isPending || !selectedType || !title.trim()}>
                {createPaperMutation.isPending ? "创建中..." : "开始生成论文"}
              </Button>
            </form>
          </Card>
        ) : null}

        <section>
          <Title1 className={styles.sectionTitle}>{isAuthenticated ? "工具箱" : "核心功能"}</Title1>
          <div className={styles.cardGrid}>
            {(isAuthenticated ? features.filter((item) => item.href) : features).map((feature) => {
              const Icon = feature.icon;
              const interactive = Boolean(feature.href);
              return (
                <Card
                  key={feature.title}
                  tabIndex={0}
                  className={mergeClasses(styles.featureCard, interactive && styles.featureCardInteractive)}
                  onClick={() => feature.href && setLocation(feature.href)}
                  onKeyDown={(event) => {
                    if ((event.key === "Enter" || event.key === " ") && feature.href) {
                      event.preventDefault();
                      setLocation(feature.href);
                    }
                  }}
                >
                  <div className={styles.iconWrap}>
                    <Icon size={18} />
                  </div>
                  <Text weight="semibold">{feature.title}</Text>
                  <Body1 className={styles.featureDescription}>{feature.description}</Body1>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
