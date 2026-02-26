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

## 前端样式规范（Tailwind v4）

**CSS 分层**：`index.css` 按 `@theme → :root → @layer base → @layer components → @utility → antd 覆盖` 组织
- 颜色令牌放 `@theme`（生成 `text-primary` 等工具类）
- 渐变/阴影/毛玻璃等复合值放 `:root`
- 组件级 class（`.glass-card`）放 `@layer components`
- 单用途工具类（`.gradient-text`）用 `@utility` 定义
- `@keyframes` 写在 `@theme` 内并以 `--animate-*` 引用

**已有 CSS 变量（写新代码时优先复用，勿硬编码）**：
- `--gradient-primary`：`linear-gradient(135deg, #7c3aed, #3b82f6)`（按钮/装饰渐变）
- `--shadow-btn` / `--shadow-btn-lg`：主色按钮阴影
- `--bg-sidebar` / `--bg-header`：侧边栏/顶栏背景
- `--glass-border` / `--glass-bg` / `--glow-primary`：毛玻璃卡片元素

**Tailwind v4 类名写法**：
- CSS 变量引用：`bg-(--gradient-primary)` 而非 `bg-[var(--gradient-primary)]`
- 像素转数字单位：`w-150`（600px）、`ml-55`（220px）、`-bottom-12.5`（50px）等
- 规范类名替代任意值：`tracking-wider`、`backdrop-blur-md`、`wrap-break-word`、`z-100`

## 前端 ESLint 规范

构建脚本已集成 ESLint：`eslint src && tsc -b && vite build`，CI 自动拦截。

```bash
cd frontend
pnpm lint        # 检查
pnpm lint:fix    # 自动修复
```

已启用规则：
- `@typescript-eslint/no-deprecated`（需 type-aware 模式）—— 检测 antd 等库的弃用属性，常见替换：
  - `destroyOnClose` → `destroyOnHidden`（Modal/Drawer）
  - `Space direction` → `orientation`
  - `Drawer width={n}` → `size="large"`（预设：default 378px / large 736px）
- `simple-import-sort`：导入分组顺序 react → 三方库 → 相对路径 → CSS

## 前端页面规范

### 卡片网格布局

管理类页面统一使用卡片网格布局（batch、models、testsets 均已采用）：

```tsx
// 网格容器
<div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
  {/* 第一张：新建卡片（虚线边框） */}
  <button
    onClick={handleNew}
    className="glass-card px-5 py-4 min-h-40 flex flex-col items-center justify-center gap-3
               border-2 border-dashed border-purple-300 hover:border-purple-500
               hover:bg-purple-50/30 cursor-pointer transition-colors
               text-purple-400 hover:text-purple-600"
  >
    <PlusOutlined style={{ fontSize: 28 }} />
    <span className="text-sm font-medium">新建 xxx</span>
  </button>
  {/* 其余：数据卡片，用 glass-card 类 */}
</div>
```

页头统一：标题用 `gradient-text`，右侧放刷新按钮。

### 页面文件拆分模式

管理类页面按以下方式拆分文件：

| 文件 | 职责 |
|------|------|
| `XxxPage.tsx` | 状态容器，网格布局，组合子组件 |
| `XxxCard.tsx` | 单张卡片，纯展示 + 操作按钮 |
| `XxxFormModal.tsx` | 新建/编辑 Modal |
| `XxxDrawer.tsx` | 详情/子项管理 Drawer（按需） |

### React 规范补充

**Rules of Hooks**：`useCallback` / `useMemo` 必须在所有 early return 之前调用。若组件有 `if (!prop) return null` 守卫，须将 hooks 提前，在 callback 内部做空值判断：

```tsx
// 正确：hooks 在 early return 之前
const handleXxx = useCallback((id: string) => {
  if (!prop) return;   // 在 callback 内部守卫
  ...
}, [prop]);

if (!prop) return null;  // early return 在 hooks 之后
```

**轮询稳定性**：`setInterval` 回调引用父组件 callback 时，用 `useRef` 避免 interval 频繁重建：

```tsx
const onUpdateRef = useRef(onUpdate);
useEffect(() => { onUpdateRef.current = onUpdate; });  // 每次渲染同步

useEffect(() => {
  const timer = setInterval(() => {
    api.get(id).then((res) => onUpdateRef.current(res.data)).catch(console.error);
  }, 3000);
  return () => clearInterval(timer);
}, [id, status]);  // 不含 onUpdate
```

## 开发注意事项

- 修改 `prisma/schema.prisma` 后必须运行 `pnpm prisma:dev` 生成迁移文件
- Docker 多阶段构建（builder + runner）两个阶段都需要执行 `prisma generate`，容器启动时自动执行 `prisma migrate deploy`
- 用量统计写入 `UsageStat`，按 `(modelId, date)` 唯一索引聚合
