# 大模型管理与评测系统

## 快速启动

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填写 ENCRYPTION_KEY（64位十六进制字符串）
# 生成方式：openssl rand -hex 32
```

### 2. Docker 一键启动

```bash
docker compose up -d
```

访问 http://localhost:3000

### 3. 本地开发启动

**前提：** PostgreSQL 运行在 localhost:5432

```bash
# 后端
cd backend
cp ../.env.example .env  # 按需修改
pnpm prisma:dev          # 执行数据库迁移
pnpm start:dev           # 启动开发服务器（端口 3001）

# 前端（新终端）
cd frontend
pnpm dev                 # 启动开发服务器（端口 3000）
```

## 项目结构

```
ss_ai_agent/
├── backend/
│   ├── src/
│   │   ├── common/
│   │   │   ├── crypto/          # AES-256-GCM 加密
│   │   │   └── llm/             # LLM 适配器层
│   │   ├── models/              # 模型管理 CRUD
│   │   ├── testsets/            # 测评集管理
│   │   ├── eval/                # 评测引擎（SSE + 批量）
│   │   └── stats/               # 用量统计
│   └── prisma/schema.prisma
├── frontend/
│   └── src/pages/
│       ├── models/              # 模型管理页
│       ├── compare/             # 实时对比页（SSE 流式）
│       ├── batch/               # 批量测评页
│       ├── testsets/            # 测评集管理页
│       ├── history/             # 历史记录页
│       └── stats/               # 用量统计页
└── docker-compose.yml
```

## 支持的服务商

| 服务商 | 接入方式 |
|--------|----------|
| OpenAI | 官方 API |
| Anthropic | 官方 SDK |
| 智谱 AI | OpenAI 兼容 |
| Moonshot | OpenAI 兼容 |
| 通义千问 | OpenAI 兼容 |
| 自定义 | OpenAI 兼容 + 自定义 BaseURL |

## API 文档

后端启动后访问：http://localhost:3001/api/docs
