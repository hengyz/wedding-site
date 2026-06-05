# 婚礼网站 (Wedding Site)

基于 React + Vite + Cloudflare Pages Functions + D1 + R2 的婚礼邀请函全栈项目。

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

- **前台**：首页、婚礼详情、地图、相册、MV、直播、祝福墙
- **后台**：http://localhost:5173/admin （Mock 模式默认密码：`admin123`）

> `npm run dev` 使用内置 Mock API，无需 Cloudflare 即可预览全部功能。  
> 连接真实 D1 数据库请使用 `npm run dev:full`（需先完成下方 D1 初始化）。

---

## 项目结构

```
├── src/                  # React 前端
├── functions/api/        # Cloudflare Pages Functions
├── migrations/           # D1 数据库迁移
├── public/               # 静态资源
├── wrangler.toml         # Cloudflare 配置
└── vite-plugin-mock-api.ts  # 本地开发 Mock API
```

---

## 初始化 D1 数据库

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

### 2. 创建 D1 数据库

```bash
npx wrangler d1 create wedding-db
```

命令会输出 `database_id`，复制到 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "wedding-db"
database_id = "你的-database-id"
```

### 3. 执行 Migration

**本地开发数据库：**

```bash
npm run db:migrate:local
```

**生产环境数据库：**

```bash
npm run db:migrate:remote
```

Migration 文件位于 `migrations/0001_init.sql`，包含表结构和示例数据。

---

## 环境变量配置

### 本地开发

复制示例文件并修改：

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` 内容：

```
ADMIN_PASSWORD=你的管理密码
JWT_SECRET=随机长字符串
R2_PUBLIC_URL=https://photos.yourdomain.com
```

### Cloudflare Pages 生产环境

在 Cloudflare Dashboard → Pages → 你的项目 → Settings → Environment variables 中添加：

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `ADMIN_PASSWORD` | Secret | 管理员登录密码 |
| `JWT_SECRET` | Secret | JWT 签名密钥（随机长字符串） |
| `R2_PUBLIC_URL` | Text | R2 公共访问域名（可选） |

---

## R2 图片存储绑定

### 1. 创建 R2 Bucket

```bash
npx wrangler r2 bucket create wedding-photos
```

### 2. 绑定到 Pages 项目

`wrangler.toml` 已配置：

```toml
[[r2_buckets]]
binding = "PHOTOS"
bucket_name = "wedding-photos"
```

### 3. 配置公共访问（可选）

在 Cloudflare Dashboard → R2 → wedding-photos → Settings → Public access，开启并绑定自定义域名，例如 `photos.yourdomain.com`。

将域名填入 `R2_PUBLIC_URL` 环境变量。

### MVP 照片管理

当前版本支持在后台 **直接填写图片 URL**（如 Unsplash、图床、R2 公共链接）。  
`POST /api/admin/photos/upload-url` 接口已预留，后续可扩展直传 R2。

---

## 部署到 Cloudflare Pages

### 方式一：Wrangler CLI

```bash
npm run build
npm run deploy
```

### 方式二：Git 集成（推荐）

1. 将代码推送到 GitHub/GitLab
2. Cloudflare Dashboard → Pages → Create a project → Connect to Git
3. 构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 在 Settings → Functions 中绑定 D1 和 R2
5. 添加环境变量（见上文）

### 绑定 D1 和 R2 到 Pages

Dashboard → Pages → 项目 → Settings → Functions：

- **D1 database bindings**: `DB` → `wedding-db`
- **R2 bucket bindings**: `PHOTOS` → `wedding-photos`

或在 `wrangler.toml` 配置后通过 Wrangler 部署自动绑定。

---

## 绑定自定义域名

1. Cloudflare Dashboard → Pages → 你的项目 → Custom domains
2. 点击 **Set up a custom domain**
3. 输入域名，如 `wedding.yourdomain.com`
4. 按提示添加 DNS 记录（若域名已在 Cloudflare，通常自动配置）
5. 等待 SSL 证书生效（通常几分钟）

---

## 邀请函二维码

1. 部署完成并绑定域名后，获得最终网址，例如：  
   `https://wedding.yourdomain.com`

2. 使用任意二维码生成工具创建二维码：
   - [草料二维码](https://cli.im/)
   - [QR Code Generator](https://www.qr-code-generator.com/)
   - 微信小程序「二维码生成器」

3. 将二维码嵌入电子邀请函或打印在纸质邀请函上

4. 宾客扫码即可访问婚礼网站

**建议**：生成二维码前先访问 `/admin` 完成内容配置（新人姓名、日期、地址、背景图等）。

---

## API 概览

### 公开 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 网站配置 |
| GET | `/api/schedules` | 婚礼流程 |
| GET | `/api/photos?category=` | 相册照片 |
| GET | `/api/blessings` | 已审核祝福 |
| POST | `/api/blessings` | 提交祝福 |

### 管理 API（需 Bearer Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/login` | 登录 |
| GET/PUT | `/api/admin/config` | 配置管理 |
| CRUD | `/api/admin/schedules` | 流程管理 |
| CRUD | `/api/admin/photos` | 相册管理 |
| GET/PUT | `/api/admin/blessings` | 祝福审核 |

---

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 前端 + Mock API（无需 Cloudflare） |
| `npm run dev:full` | 前端 + 真实 Pages Functions + 本地 D1 |
| `npm run build` | 构建生产包 |
| `npm run deploy` | 部署到 Cloudflare Pages |
| `npm run db:migrate:local` | 本地 D1 迁移 |
| `npm run db:migrate:remote` | 远程 D1 迁移 |

---

## 技术栈

- 前端：React 18 + Vite + TypeScript + Tailwind CSS + React Router
- 后端：Cloudflare Pages Functions
- 数据库：Cloudflare D1 (SQLite)
- 存储：Cloudflare R2
- 认证：JWT (Web Crypto HMAC-SHA256)

---

## License

MIT
