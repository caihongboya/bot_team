# API 设计文档

**文档版本：** v1.0  
**创建时间：** 2026-03-17  
**技术负责人：** 小波

---

## 1. API 概览

### 1.1 基础信息

- **基础路径**: `/api/v1`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: 公开访问（MVP 阶段）

### 1.2 响应格式

**成功响应**:
```json
{
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**错误响应**:
```json
{
  "error": "错误信息",
  "code": "错误代码"
}
```

### 1.3 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 2. 文章 API

### 2.1 获取文章列表

**请求**:
```
GET /api/v1/articles
```

**查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码 |
| limit | integer | 否 | 20 | 每页数量 |
| category | string | 否 | - | 分类 slug |
| status | string | 否 | published | 文章状态 |

**响应示例**:
```json
{
  "data": [
    {
      "id": 1,
      "title": "英国短毛猫",
      "slug": "british-shorthair",
      "summary": "英国短毛猫是最受欢迎的猫咪品种之一...",
      "coverImage": "/images/cats/british-shorthair.jpg",
      "category": {
        "id": 1,
        "name": "猫咪",
        "slug": "cats"
      },
      "createdAt": "2026-03-17T10:00:00Z",
      "viewCount": 1234
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 165,
    "totalPages": 9
  }
}
```

---

### 2.2 获取文章详情

**请求**:
```
GET /api/v1/articles/:slug
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 文章 slug |

**响应示例**:
```json
{
  "id": 1,
  "title": "英国短毛猫",
  "slug": "british-shorthair",
  "contentHtml": "<h1>英国短毛猫</h1><p>...</p>",
  "contentMd": "# 英国短毛猫\n...",
  "summary": "英国短毛猫是最受欢迎的猫咪品种之一...",
  "coverImage": "/images/cats/british-shorthair.jpg",
  "category": {
    "id": 1,
    "name": "猫咪",
    "slug": "cats",
    "icon": "🐱",
    "parentId": null
  },
  "parentCategory": null,
  "tags": [
    {
      "id": 1,
      "name": "猫咪",
      "slug": "mao-mi"
    }
  ],
  "relatedArticles": [
    {
      "id": 2,
      "title": "波斯猫",
      "slug": "persian",
      "summary": "...",
      "coverImage": "...",
      "createdAt": "2026-03-17T10:00:00Z",
      "viewCount": 890
    }
  ],
  "createdAt": "2026-03-17T10:00:00Z",
  "updatedAt": "2026-03-17T10:00:00Z",
  "viewCount": 1235
}
```

---

### 2.3 创建文章（管理员）

**请求**:
```
POST /api/v1/articles
```

**请求体**:
```json
{
  "title": "文章标题",
  "slug": "article-slug",
  "categoryId": 1,
  "subcategoryId": 2,
  "summary": "文章摘要",
  "contentMd": "# 文章内容\n...",
  "coverImage": "/images/cover.jpg",
  "status": "draft",
  "tags": ["标签 1", "标签 2"]
}
```

**响应**:
```json
{
  "id": 123,
  "slug": "article-slug",
  "message": "文章创建成功"
}
```

---

### 2.4 更新文章（管理员）

**请求**:
```
PUT /api/v1/articles/:id
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 文章 ID |

**请求体**:
```json
{
  "title": "更新后的标题",
  "summary": "更新后的摘要",
  "contentMd": "# 更新后的内容\n...",
  "status": "published"
}
```

**响应**:
```json
{
  "id": 123,
  "message": "文章更新成功"
}
```

---

### 2.5 删除文章（管理员）

**请求**:
```
DELETE /api/v1/articles/:id
```

**响应**:
```json
{
  "message": "文章删除成功"
}
```

---

## 3. 分类 API

### 3.1 获取分类列表

**请求**:
```
GET /api/v1/categories
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| parent | string | 否 | 父分类 slug |

**响应示例**:

获取一级分类:
```json
{
  "data": [
    {
      "id": 1,
      "name": "猫咪",
      "slug": "cats",
      "parentId": null,
      "icon": "🐱",
      "sortOrder": 1,
      "createdAt": "2026-03-17T10:00:00Z",
      "updatedAt": "2026-03-17T10:00:00Z",
      "parent": null
    },
    {
      "id": 2,
      "name": "狗狗",
      "slug": "dogs",
      "parentId": null,
      "icon": "🐶",
      "sortOrder": 2,
      "createdAt": "2026-03-17T10:00:00Z",
      "updatedAt": "2026-03-17T10:00:00Z",
      "parent": null
    }
  ]
}
```

获取指定父分类的子分类:
```json
{
  "data": [
    {
      "id": 11,
      "name": "品种介绍",
      "slug": "cat-breeds",
      "parentId": 1,
      "icon": null,
      "sortOrder": 1,
      "createdAt": "2026-03-17T10:00:00Z",
      "updatedAt": "2026-03-17T10:00:00Z",
      "parent": {
        "name": "猫咪",
        "slug": "cats"
      }
    }
  ]
}
```

---

## 4. 搜索 API

### 4.1 搜索文章

**请求**:
```
GET /api/v1/search
```

**查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| q | string | 是 | - | 搜索关键词 |
| page | integer | 否 | 1 | 页码 |
| limit | integer | 否 | 20 | 每页数量 |

**响应示例**:
```json
{
  "query": "英短",
  "data": [
    {
      "id": 1,
      "title": "英国短毛猫",
      "slug": "british-shorthair",
      "summary": "英国短毛猫是最受欢迎的猫咪品种之一...",
      "highlight": "<b>英国短毛猫</b>是最受欢迎的猫咪品种之一，以其圆润的脸庞...",
      "category": {
        "name": "猫咪",
        "slug": "cats"
      },
      "score": 0.856
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

**搜索功能说明**:

1. **全文搜索**: 使用 PostgreSQL tsvector 实现
2. **权重分配**: 标题 > 摘要 > 内容
3. **关键词高亮**: 使用 `ts_headline` 函数
4. **相关度排序**: 使用 `ts_rank` 函数

---

## 5. 标签 API（预留）

### 5.1 获取标签列表

**请求**:
```
GET /api/v1/tags
```

**响应**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "猫咪",
      "slug": "mao-mi",
      "articleCount": 50
    }
  ]
}
```

---

## 6. 错误处理

### 6.1 错误响应格式

```json
{
  "error": "错误描述信息",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 6.2 常见错误代码

| 错误代码 | HTTP 状态码 | 说明 |
|----------|-------------|------|
| NOT_FOUND | 404 | 资源不存在 |
| INVALID_PARAMS | 400 | 请求参数错误 |
| DUPLICATE_SLUG | 400 | Slug 重复 |
| DATABASE_ERROR | 500 | 数据库错误 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

### 6.3 错误处理示例

**请求不存在的文章**:
```
GET /api/v1/articles/non-existent-slug
```

**响应**:
```json
{
  "error": "Article not found",
  "code": "NOT_FOUND"
}
```

---

## 7. 性能优化

### 7.1 分页策略

- 默认每页 20 条
- 最大每页 100 条
- 使用 OFFSET/LIMIT 分页
- 返回总页数方便前端展示

### 7.2 缓存策略

**建议缓存**:
- 分类列表：5 分钟
- 文章详情：1 分钟
- 搜索结果：30 秒

**缓存头示例**:
```
Cache-Control: public, max-age=60
ETag: "abc123"
```

### 7.3 数据库优化

- 使用索引加速查询
- 使用视图简化复杂查询
- 使用物化视图缓存统计信息
- 定期 VACUUM 和 ANALYZE

---

## 8. 安全考虑

### 8.1 输入验证

- 验证所有输入参数
- 防止 SQL 注入（使用参数化查询）
- 限制请求体大小
- 过滤 HTML 标签（XSS 防护）

### 8.2 速率限制（后续实现）

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1647504000
```

### 8.3 CORS 配置

```javascript
// Next.js middleware 配置
export const config = {
  matcher: '/api/:path*',
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
}
```

---

## 9. 版本管理

### 9.1 版本策略

- URL 路径版本：`/api/v1/`
- 向后兼容：不破坏现有 API
- 废弃通知：提前 3 个月通知

### 9.2 版本升级流程

1. 开发新版本 API（v2）
2. 并行运行 v1 和 v2
3. 通知用户迁移
4. 废弃旧版本

---

## 10. 测试

### 10.1 测试用例

**获取文章列表**:
```bash
curl http://localhost:3000/api/v1/articles
```

**获取文章详情**:
```bash
curl http://localhost:3000/api/v1/articles/british-shorthair
```

**搜索文章**:
```bash
curl "http://localhost:3000/api/v1/search?q=英短"
```

**获取分类**:
```bash
curl http://localhost:3000/api/v1/categories
```

### 10.2 Postman 集合

导入 Postman 集合文件：`/docs/api.postman_collection.json`

---

## 11. 监控与日志

### 11.1 日志记录

记录以下信息：
- 请求方法、路径、参数
- 响应状态码
- 响应时间
- 错误堆栈

### 11.2 监控指标

- QPS（每秒请求数）
- 响应时间（P50, P95, P99）
- 错误率
- 数据库查询性能

---

## 12. 后续扩展

### 12.1 计划中的 API

- 用户认证 API（V2.0）
- 评论 API（V2.0）
- 收藏 API（V2.0）
- 上传 API（图片/附件）
- 统计 API（浏览量、热门搜索）

### 12.2 GraphQL 支持（评估中）

考虑在 V2.0 引入 GraphQL，提供更灵活的数据查询能力。

---

*最后更新：2026-03-17*
