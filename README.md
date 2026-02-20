# AI Writing Platform

## 运行前置条件

- Node.js 20+
- pnpm 10+
- 可用数据库连接（`DATABASE_URL`）
- 生产部署时必须显式设置 `PORT`（生产环境不会自动探测备用端口）

## 环境变量清单

| 变量名 | 是否必填 | 说明 |
| --- | --- | --- |
| `NODE_ENV` | 否 | 建议：开发环境为 `development`，生产环境为 `production`。 |
| `PORT` | **生产必填** | 服务监听端口；生产环境必须提供合法正整数。 |
| `DATABASE_URL` | 推荐 | 数据库连接字符串。 |
| `JWT_SECRET` | 推荐 | 鉴权 Cookie/Token 签名密钥。 |
| `OAUTH_SERVER_URL` | 可选 | OAuth 服务地址。 |
| `OWNER_OPEN_ID` | 可选 | 业务 Owner OpenID。 |
| `BUILT_IN_FORGE_API_URL` | 可选 | Forge API 地址。 |
| `BUILT_IN_FORGE_API_KEY` | 可选 | Forge API 密钥。 |
| `VITE_APP_ID` | 可选 | 前端应用标识。 |

## 本地开发

```bash
pnpm install
pnpm dev
```

## 构建与启动

```bash
pnpm build
PORT=3000 NODE_ENV=production node dist/index.js
```

## Docker 部署

### 构建镜像

```bash
docker build -t ai-writing-platform .
```

### 运行容器

```bash
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_URL=your_database_url \
  ai-writing-platform
```

### 使用 Docker Compose

```bash
docker compose up --build
```

## Vercel 部署

仓库已提供 `vercel.json`，默认执行：

- `pnpm install --frozen-lockfile`
- `pnpm build`

并将所有路由转发到 `dist/index.js`（Node.js 20 运行时）。部署前请在 Vercel 项目中配置上表环境变量，至少确保生产环境 `PORT` 与 `NODE_ENV=production` 可用。
