# AI Writing Platform

一个面向学术写作场景的全栈应用，提供从初稿生成到润色发布的闭环能力。核心功能包括：

- **论文生成**：基于主题与结构快速生成章节内容。
- **编辑与润色**：支持在线编辑、内容改写与格式整理。
- **图表辅助**：在写作过程中插入或展示可视化图表。
- **翻译支持**：支持中英文等多语言内容转换。
- **质量检测**：对文本进行基础质量检查与结果反馈。

## 快速开始

### 依赖要求

- Node.js 20+
- pnpm 10+
- MySQL（或兼容 `DATABASE_URL` 的数据库）

### 安装

```bash
pnpm install
```

### 开发启动

```bash
pnpm dev
```

### 生产构建与启动

```bash
pnpm build
pnpm start
```

> 可选：首次初始化或变更数据库结构后执行 `pnpm db:push`。

## 部署

### 必要环境变量

最少建议配置以下变量：

| 变量名                  | 用途                                 | 是否建议必配      |
| ----------------------- | ------------------------------------ | ----------------- |
| `NODE_ENV`              | 运行环境（生产设为 `production`）    | 是                |
| `PORT`                  | 服务监听端口（生产环境必须为正整数） | 是                |
| `DATABASE_URL`          | 数据库连接串                         | 是                |
| `JWT_SECRET`            | 鉴权签名密钥                         | 建议              |
| `OAUTH_SERVER_URL`      | OAuth 服务地址                       | 使用 OAuth 时必配 |
| `VITE_APP_ID`           | 前端应用标识                         | 使用 OAuth 时建议 |
| `VITE_OAUTH_PORTAL_URL` | OAuth 门户地址                       | 使用 OAuth 时建议 |

### Vercel（最小步骤）

1. 将仓库导入 Vercel。
2. 使用仓库内 `vercel.json` 默认配置（安装：`pnpm install --frozen-lockfile`，构建：`pnpm build`）。
3. 在 Vercel Project Settings → Environment Variables 中配置上表变量。
4. 部署后确认服务可访问，并验证 `/api/oauth/callback` 回调路径。

### Docker（最小步骤）

```bash
docker build -t ai-writing-platform .

docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_URL='mysql://user:pass@host:3306/dbname' \
  -e JWT_SECRET='replace-with-strong-secret' \
  ai-writing-platform
```

## 目录结构

- `client/`：前端应用（页面、组件、交互逻辑）。
- `server/`：后端服务（API、鉴权、业务逻辑、SSR/静态资源托管入口）。
- `shared/`：前后端共享类型与通用模块。
- `drizzle/`：数据库迁移与元数据（Drizzle ORM）。

## 常见问题 / 排障

- **端口启动失败**：生产环境必须显式设置合法 `PORT`；开发环境默认尝试 `3000` 并自动找可用端口。
- **数据库连接失败**：确认 `DATABASE_URL` 格式正确、数据库可访问，且已执行 `pnpm db:push`。
- **OAuth 登录后回调异常**：确认回调地址为 `https://你的域名/api/oauth/callback`（本地为 `http://localhost:3000/api/oauth/callback`），并与 OAuth 平台配置一致。
