# 宠物百科全书爬虫系统

**版本：** v1.0  
**日期：** 2026-03-17  
**技术负责人：** 小波

---

## 快速开始

### 1. 环境准备

```bash
# 进入项目目录
cd /home/kite/.openclaw/workspace/pet-encyclopedia/crawler

# 激活虚拟环境
source ../venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 安装 Playwright 浏览器
playwright install chromium
```

### 2. 运行爬虫

```bash
# 运行维基百科爬虫
scrapy crawl wikipedia_pet

# 带日志输出
scrapy crawl wikipedia_pet -L INFO

# 限制爬取页数
scrapy crawl wikipedia_pet -s CLOSESPIDER_PAGECOUNT=100

# 输出到文件
scrapy crawl wikipedia_pet -o output.json
```

### 3. 查看监控

```bash
# 访问 Prometheus 指标（需要启动爬虫）
curl http://localhost:8000/metrics
```

---

## 项目结构

```
crawler/
├── crawler_core/              # Scrapy 项目核心
│   ├── spiders/              # Spider 定义
│   ├── middlewares/          # 中间件
│   ├── pipelines/            # 数据管道
│   ├── items.py             # Item 定义
│   ├── settings.py          # 配置
│   └── utils/               # 工具函数
├── config/
│   └── sites.yaml           # 站点配置
├── tests/                    # 测试
├── logs/                     # 日志
├── scrapy.cfg                # Scrapy 配置
├── requirements.txt          # 依赖
└── README.md                 # 本文档
```

---

## 核心功能

### 反反爬策略

- ✅ User-Agent 轮换（15+ UA）
- ✅ 代理 IP 池管理
- ✅ 请求速率限制
- ✅ 自动重试机制
- ✅ Cookie 管理

### 去重系统

- ✅ Redis Bloom Filter（URL 去重）
- ✅ SimHash（内容指纹）
- ✅ 分布式去重支持

### 数据清洗

- ✅ Readability 正文提取
- ✅ 质量评分（0-1）
- ✅ Markdown 转换
- ✅ 噪声过滤

### 数据存储

- ✅ MongoDB（原始 HTML）
- ✅ PostgreSQL（结构化内容）
- ✅ MinIO（图片存储）

### 监控和日志

- ✅ Prometheus 指标
- ✅ 日志轮转
- ✅ 错误告警

---

## 可用 Spider

| Spider | 域名 | 状态 | 说明 |
|--------|------|------|------|
| wikipedia_pet | zh.wikipedia.org | ✅ 可用 | 维基百科宠物条目 |
| pet_home | pet-home.com | 🚧 开发中 | 宠物之家 |
| boqii | boqii.com | 🚧 开发中 | 波奇网 |

---

## 配置说明

### 环境变量

创建 `.env` 文件：

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MongoDB
MONGODB_URI=mongodb://localhost:27017/

# PostgreSQL
POSTGRES_URI=postgresql://localhost/pet_encyclopedia

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### 站点配置

编辑 `config/sites.yaml` 添加新站点：

```yaml
sites:
  my_site:
    name: "我的站点"
    domain: "example.com"
    priority: "P0"
    base_url: "https://example.com"
    
    crawl:
      enabled: true
      depth: 3
      max_pages: 1000
    
    parsing:
      title_selector: "h1.title"
      content_selector: ".content"
```

---

## 开发指南

### 添加新 Spider

1. 创建 Spider 文件：`crawler_core/spiders/myspider.py`

```python
from crawler_core.spiders.base import BaseSpider
from crawler_core.items import PetArticleItem

class MySpider(BaseSpider):
    name = 'my_spider'
    allowed_domains = ['example.com']
    start_urls = ['https://example.com']
    
    def parse(self, response):
        item = PetArticleItem()
        item['title'] = response.css('h1::text').get()
        item['content'] = response.css('.content::text').get()
        yield item
```

2. 运行爬虫：

```bash
scrapy crawl my_spider
```

### 调试

```bash
# Scrapy Shell
scrapy shell 'https://example.com'

# 测试选择器
response.css('h1::text').get()
```

---

## 测试

```bash
# 运行所有测试
pytest tests/

# 带覆盖率
pytest tests/ --cov=crawler_core
```

---

## 监控指标

| 指标名称 | 类型 | 说明 |
|----------|------|------|
| crawler_requests_total | Counter | 请求总数 |
| crawler_items_scraped_total | Counter | 爬取 item 数 |
| crawler_errors_total | Counter | 错误数 |
| crawler_content_quality_score | Histogram | 内容质量分布 |
| crawler_queue_size | Gauge | 队列大小 |

---

## 故障排查

### 问题：爬虫无法连接 Redis

**解决：**
```bash
# 检查 Redis 服务
redis-cli ping

# 如果返回 PONG 则正常
```

### 问题：图片下载失败

**解决：**
```bash
# 检查 MinIO 服务
# 访问 http://localhost:9000

# 检查 bucket 是否存在
```

### 问题：内容质量为 0

**解决：**
- 检查网站是否有 JavaScript 渲染
- 启用 Playwright 中间件
- 调整正文提取规则

---

## 下一步

- [ ] 添加更多内容源 Spider
- [ ] 优化去重算法性能
- [ ] 完善监控告警
- [ ] 部署到生产环境

---

## 许可证

内部项目，禁止外传。

---

*文档持续更新中...*
