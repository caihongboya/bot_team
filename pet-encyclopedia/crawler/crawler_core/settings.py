# Scrapy settings for crawler_core project
# 宠物百科全书爬虫系统配置

BOT_NAME = "crawler_core"

SPIDER_MODULES = ["crawler_core.spiders"]
NEWSPIDER_MODULE = "crawler_core.spiders"

# =============================================================================
# 基础配置
# =============================================================================

# 遵守 robots.txt 规则
ROBOTSTXT_OBEY = True

# 用户代理池（在 middleware 中实现轮换）
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# =============================================================================
# 并发和节流配置
# =============================================================================

# 全局并发请求数
CONCURRENT_REQUESTS = 16

# 每域名并发请求数（分站点配置）
CONCURRENT_REQUESTS_PER_DOMAIN = 2

# 下载延迟（秒）
DOWNLOAD_DELAY = 1

# 启用自动节流
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 2
AUTOTHROTTLE_MAX_DELAY = 30
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0
AUTOTHROTTLE_DEBUG = False

# 下载超时（秒）
DOWNLOAD_TIMEOUT = 30

# =============================================================================
# 重试配置
# =============================================================================

RETRY_ENABLED = True
RETRY_TIMES = 3
RETRY_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# =============================================================================
# Cookie 和缓存
# =============================================================================

COOKIES_ENABLED = True
COOKIES_DEBUG = False

HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 86400  # 24 小时
HTTPCACHE_DIR = "httpcache"
HTTPCACHE_IGNORE_HTTP_CODES = [500, 502, 503, 504]
HTTPCACHE_STORAGE = "scrapy.extensions.httpcache.FilesystemCacheStorage"

# =============================================================================
# 中间件配置
# =============================================================================

DOWNLOADER_MIDDLEWARES = {
    # Scrapy 内置
    'scrapy.downloadermiddlewares.robotstxt.RobotsTxtMiddleware': 100,
    'scrapy.downloadermiddlewares.httpauth.HttpAuthMiddleware': 300,
    'scrapy.downloadermiddlewares.downloadtimeout.DownloadTimeoutMiddleware': 350,
    'scrapy.downloadermiddlewares.defaultheaders.DefaultHeadersMiddleware': 400,
    'scrapy.downloadermiddlewares.useragent.UserAgentMiddleware': 500,
    'scrapy.downloadermiddlewares.retry.RetryMiddleware': 550,
    'scrapy.downloadermiddlewares.redirect.MetaRefreshMiddleware': 580,
    'scrapy.downloadermiddlewares.httpcompression.HttpCompressionMiddleware': 590,
    'scrapy.downloadermiddlewares.redirect.RedirectMiddleware': 600,
    'scrapy.downloadermiddlewares.cookies.CookiesMiddleware': 700,
    'scrapy.downloadermiddlewares.httpproxy.HttpProxyMiddleware': 750,
    'scrapy.downloadermiddlewares.stats.DownloaderStats': 850,
    'scrapy.downloadermiddlewares.httpcache.HttpCacheMiddleware': 900,
    
    # 自定义中间件
    'crawler_core.middlewares.useragent.UserAgentRandomizerMiddleware': 1000,
    'crawler_core.middlewares.proxy.ProxyMiddleware': 1100,
    'crawler_core.middlewares.retry.CustomRetryMiddleware': 1200,
}

SPIDER_MIDDLEWARES = {
    'scrapy.spidermiddlewares.offsite.OffsiteMiddleware': 500,
    'scrapy.spidermiddlewares.referer.RefererMiddleware': 700,
    'scrapy.spidermiddlewares.urllength.UrlLengthMiddleware': 800,
    'scrapy.spidermiddlewares.depth.DepthMiddleware': 900,
    
    # 自定义中间件
    'crawler_core.middlewares.dedup.DedupMiddleware': 1000,
}

# =============================================================================
# Pipeline 配置
# =============================================================================

ITEM_PIPELINES = {
    'crawler_core.pipelines.cleaning.CleaningPipeline': 100,
    'crawler_core.pipelines.dedup.ItemDedupPipeline': 200,
    'crawler_core.pipelines.storage.MongoDBPipeline': 300,
    'crawler_core.pipelines.storage.PostgreSQLPipeline': 400,
    'crawler_core.pipelines.images.ImageDownloadPipeline': 500,
}

# =============================================================================
# 日志配置
# =============================================================================

LOG_ENABLED = True
LOG_LEVEL = 'INFO'
LOG_FORMAT = '%(asctime)s [%(name)s] %(levelname)s: %(message)s'
LOG_DATEFORMAT = '%Y-%m-%d %H:%M:%S'
LOG_FILE = 'logs/crawler.log'
LOG_FILE_MAX_BYTES = 10 * 1024 * 1024  # 10MB
LOG_FILE_BACKUP_COUNT = 5

# =============================================================================
# 扩展配置
# =============================================================================

EXTENSIONS = {
    'scrapy.extensions.telnet.TelnetConsole': None,
    'scrapy.extensions.corestats.CoreStats': 500,
    'scrapy.extensions.memusage.MemoryUsage': 800,
}

# 内存使用警告
MEMUSAGE_ENABLED = True
MEMUSAGE_LIMIT_MB = 2048
MEMUSAGE_WARNING_MB = 1536
MEMUSAGE_NOTIFY_MAIL = ['xiaobo@pet-encyclopedia.com']

# =============================================================================
# 深度和范围限制
# =============================================================================

DEPTH_LIMIT = 5
DEPTH_PRIORITY = 1
DEPTH_STATS_VERBOSE = True

CLOSESPIDER_TIMEOUT = 3600  # 1 小时超时
CLOSESPIDER_ITEMCOUNT = 10000  # 爬取 10000 项后停止
CLOSESPIDER_PAGECOUNT = 50000  # 爬取 50000 页后停止
CLOSESPIDER_ERRORCOUNT = 100  # 100 个错误后停止

# =============================================================================
# Feed 导出配置
# =============================================================================

FEED_EXPORT_ENCODING = 'utf-8'
FEED_EXPORT_INDENT = 2

# =============================================================================
# 自定义配置
# =============================================================================

# Redis 配置
REDIS_HOST = 'localhost'
REDIS_PORT = 6379
REDIS_DB = 0
REDIS_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}'

# MongoDB 配置
MONGODB_URI = 'mongodb://localhost:27017/'
MONGODB_DB = 'pet_encyclopedia_raw'

# PostgreSQL 配置
POSTGRES_URI = 'postgresql://postgres:postgres@localhost:5432/pet_encyclopedia'

# MinIO 配置
MINIO_ENDPOINT = 'localhost:9000'
MINIO_ACCESS_KEY = 'minioadmin'
MINIO_SECRET_KEY = 'minioadmin'
MINIO_BUCKET = 'pet-encyclopedia'
MINIO_SECURE = False

# Playwright 配置
PLAYWRIGHT_ENABLED = True
PLAYWRIGHT_BROWSER_TYPE = 'chromium'
PLAYWRIGHT_LAUNCH_OPTIONS = {
    'headless': True,
    'args': ['--no-sandbox', '--disable-setuid-sandbox'],
}

# 去重配置
DEDUP_BLOOM_FILTER_CAPACITY = 100_000_000
DEDUP_BLOOM_FILTER_ERROR_RATE = 0.001
DEDUP_SIMHASH_THRESHOLD = 3

# 分站点速率限制
DOMAIN_RATE_LIMITS = {
    'zh.wikipedia.org': {'delay': 0.5, 'concurrent': 4},
    'baike.baidu.com': {'delay': 2, 'concurrent': 1},
    'pet-home.com': {'delay': 2, 'concurrent': 1},
    'boqii.com': {'delay': 1.5, 'concurrent': 2},
}

# 监控配置
PROMETHEUS_ENABLED = True
PROMETHEUS_PORT = 8000
