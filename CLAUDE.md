# 大模型管理与评测系统

全栈应用，管理多 LLM 模型配置、实时对比测评、批量测评、用量统计。

**技术栈**：NestJS + Prisma + PostgreSQL（后端）/ React + Ant Design（前端）/ pnpm / Docker Compose

## 常用命令

```bash
# 首次配置
cp .env.example .env   # 修改 ENCRYPTION_KEY、ADMIN_PASSWORD、JWT_SECRET

# 本地开发（需本地 PostgreSQL）
cd backend && pnpm prisma:dev && pnpm start:dev   # 端口 3001
cd frontend && pnpm dev                            # 端口 3000

# Docker
docker compose up -d           # 启动
docker compose up -d --build   # 代码变更后重建
```

## 环境变量

所有变量统一放根目录 `.env`，后端通过 `dotenv-cli` 读取 `../.env`。

| 变量 | 说明 | 生成方式 |
|------|------|----------|
| `ENCRYPTION_KEY` | AES-256-GCM 密钥，64 位十六进制 | `openssl rand -hex 32` |
| `JWT_SECRET` | JWT 签名密钥，至少 32 字符 | `openssl rand -base64 32` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 管理员账号（写死在 `.env`，无注册功能）| 自定义 |
| `JWT_EXPIRES_IN` | Token 有效期，默认 `7d` | — |

## 关键架构

**LLM 适配器**：`backend/src/common/llm/llm-adapter.factory.ts` 根据 provider 分发
- `anthropic` → `anthropic.adapter.ts`（Anthropic SDK）
- 其余所有服务商 → `openai.adapter.ts`（OpenAI SDK，设 baseUrl 兼容）

**API Key 加密**：写入数据库前经 `CryptoModule`（AES-256-GCM）加密，读取时解密

**认证**：全局 `JwtAuthGuard`，登录接口用 `@Public()` 装饰器豁免

**前端路由**：无 react-router，`App.tsx` 用 state 切换页面；`/api` 请求由 Vite proxy 转发至 `localhost:3001`

## 开发注意事项

- 修改 `prisma/schema.prisma` 后必须运行 `pnpm prisma:dev` 生成迁移文件
- Docker 多阶段构建（builder + runner）两个阶段都需要执行 `prisma generate`，容器启动时自动执行 `prisma migrate deploy`
- 用量统计写入 `UsageStat`，按 `(modelId, date)` 唯一索引聚合
