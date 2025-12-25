# 文档来源处理能力改进计划

## 目标
1. **改进 URL 内容清理** - 使用 Readability 算法 + 优化 AI 提示词
2. **添加 PDF 文件支持** - 支持上传和解析 PDF

---

## 第一阶段：URL 内容清理优化

### 1.1 安装依赖
```bash
cd server && pnpm add linkedom @mozilla/readability
```

### 1.2 新建 `server/src/services/content-extractor/url-extractor.ts`
- 使用 `linkedom` 解析 HTML（Cloudflare Workers 兼容）
- 使用 `@mozilla/readability` 提取正文（Firefox 阅读模式同款）
- 导出 `extractFromUrl(url)` 和 `extractFromHtml(html, baseUrl)`

### 1.3 修改 `server/src/services/document-processor.ts`
- 替换 `fetchUrlContent()` 函数，改用 url-extractor
- 删除 `extractTextFromHtml()` 函数（约 44 行）

### 1.4 优化 `server/src/services/source-analyzer.ts`
更新 `ANALYSIS_PROMPT`，明确要求移除：
- 用户评论和讨论区
- 社交分享按钮
- 广告和订阅推广
- Cookie 提示
- "相关文章" 推荐
- 页脚版权信息

---

## 第二阶段：PDF 文件支持

### 2.1 安装依赖
```bash
cd server && pnpm add unpdf
```

### 2.2 新建 `server/src/services/content-extractor/pdf-extractor.ts`
- 使用 `unpdf`（Cloudflare 官方推荐）
- 导出 `extractFromPdf(buffer)` 和 `extractFromR2(bucket, key)`

### 2.3 新建 `server/src/services/content-extractor/index.ts`
- 统一导出 url-extractor 和 pdf-extractor

### 2.4 修改 `server/src/services/document-processor.ts`
- 在 `DocumentInfo` 接口添加 `r2Key?: string`
- 在 `processDocument()` 添加 PDF 处理分支

### 2.5 修改 `server/src/routes/documents.ts`
- 新增 `POST /upload-pdf` 端点（multipart/form-data）
- 上传 PDF 到 R2，创建文档记录，触发处理

### 2.6 修改前端
- `web/src/components/documents/upload-dialog.tsx` - 添加 PDF tab
- `web/src/lib/api.ts` - 添加 `uploadPdfDocument()` 函数
- `web/src/messages/en/chat.json` + `zh/chat.json` - 添加翻译

---

## 关键文件列表

| 文件 | 操作 | 说明 |
|------|------|------|
| `server/src/services/content-extractor/url-extractor.ts` | 新建 | Readability 提取 |
| `server/src/services/content-extractor/pdf-extractor.ts` | 新建 | PDF 解析 |
| `server/src/services/content-extractor/index.ts` | 新建 | 统一导出 |
| `server/src/services/document-processor.ts` | 修改 | 集成新提取器 |
| `server/src/services/source-analyzer.ts` | 修改 | 优化 AI 提示词 |
| `server/src/routes/documents.ts` | 修改 | PDF 上传端点 |
| `web/src/components/documents/upload-dialog.tsx` | 修改 | PDF 上传 UI |
| `web/src/lib/api.ts` | 修改 | PDF 上传函数 |
| `web/src/messages/en/chat.json` | 修改 | 英文翻译 |
| `web/src/messages/zh/chat.json` | 修改 | 中文翻译 |

---

## 技术选型说明

| 需求 | 选型 | 原因 |
|------|------|------|
| HTML 解析 | linkedom | 专为 Cloudflare Workers 设计，无 Node.js 依赖 |
| 正文提取 | @mozilla/readability | 业界标准，Firefox 阅读模式同款 |
| PDF 解析 | unpdf | Cloudflare 官方推荐，内置 serverless PDF.js |

---

## 实施顺序

1. ✅ 安装后端依赖 (`linkedom`, `@mozilla/readability`, `unpdf`)
2. ✅ 创建 content-extractor 目录和三个文件
3. ✅ 修改 document-processor.ts 集成新提取器
4. ✅ 优化 source-analyzer.ts 的 AI 提示词
5. ✅ 修改 documents.ts 添加 PDF 上传端点
6. ✅ 修改前端 upload-dialog.tsx 添加 PDF tab
7. ✅ 更新 api.ts 和翻译文件
8. ✅ 部署测试
