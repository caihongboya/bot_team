"""
监控指标工具 - Prometheus
"""
from prometheus_client import Counter, Histogram, Gauge, start_http_server
from typing import Dict, Optional
import time


class CrawlerMetrics:
    """
    爬虫监控指标
    
    指标类型：
    - Counter: 计数器（请求总数、错误数等）
    - Gauge: 仪表盘（队列大小、活跃 Worker 数等）
    - Histogram: 直方图（响应时间、内容质量等）
    """
    
    def __init__(self, port: int = 8000):
        self.port = port
        self.start_time = time.time()
        
        # 计数器
        self.requests_total = Counter(
            'crawler_requests_total',
            'Total HTTP requests',
            ['domain', 'status', 'spider'],
        )
        
        self.items_scraped_total = Counter(
            'crawler_items_scraped_total',
            'Total items scraped',
            ['spider', 'source_site'],
        )
        
        self.errors_total = Counter(
            'crawler_errors_total',
            'Total errors',
            ['spider', 'error_type'],
        )
        
        self.retries_total = Counter(
            'crawler_retries_total',
            'Total retries',
            ['spider', 'reason'],
        )
        
        self.duplicates_filtered_total = Counter(
            'crawler_duplicates_filtered_total',
            'Total duplicates filtered',
            ['type'],  # url, content
        )
        
        # 直方图
        self.request_duration = Histogram(
            'crawler_request_duration_seconds',
            'HTTP request duration',
            ['domain', 'spider'],
            buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0),
        )
        
        self.content_quality = Histogram(
            'crawler_content_quality_score',
            'Content quality score',
            ['spider', 'source_site'],
            buckets=(0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0),
        )
        
        self.page_word_count = Histogram(
            'crawler_page_word_count',
            'Page word count',
            ['spider'],
            buckets=(100, 200, 500, 1000, 2000, 5000, 10000),
        )
        
        # 仪表盘
        self.queue_size = Gauge(
            'crawler_queue_size',
            'Queue size',
            ['queue_name'],
        )
        
        self.worker_active = Gauge(
            'crawler_workers_active',
            'Active workers',
        )
        
        self.proxy_pool_size = Gauge(
            'crawler_proxy_pool_size',
            'Proxy pool size',
            ['status'],  # available, total
        )
        
        self.storage_usage = Gauge(
            'crawler_storage_usage_bytes',
            'Storage usage',
            ['storage_type'],  # mongodb, postgresql, minio
        )
    
    def start_server(self):
        """启动 Prometheus 指标服务器"""
        start_http_server(self.port)
        print(f"Metrics server started on port {self.port}")
    
    def record_request(self, domain: str, status: int, spider: str, duration: float):
        """记录请求"""
        self.requests_total.labels(domain=domain, status=status, spider=spider).inc()
        self.request_duration.labels(domain=domain, spider=spider).observe(duration)
    
    def record_item(self, spider: str, source_site: str, quality_score: float, word_count: int):
        """记录爬取的 item"""
        self.items_scraped_total.labels(spider=spider, source_site=source_site).inc()
        self.content_quality.labels(spider=spider, source_site=source_site).observe(quality_score)
        self.page_word_count.labels(spider=spider).observe(word_count)
    
    def record_error(self, spider: str, error_type: str):
        """记录错误"""
        self.errors_total.labels(spider=spider, error_type=error_type).inc()
    
    def record_retry(self, spider: str, reason: str):
        """记录重试"""
        self.retries_total.labels(spider=spider, reason=reason).inc()
    
    def record_duplicate(self, dup_type: str):
        """记录去重"""
        self.duplicates_filtered_total.labels(type=dup_type).inc()
    
    def update_queue_size(self, queue_name: str, size: int):
        """更新队列大小"""
        self.queue_size.labels(queue_name=queue_name).set(size)
    
    def update_worker_active(self, count: int):
        """更新活跃 Worker 数"""
        self.worker_active.set(count)
    
    def update_proxy_pool(self, available: int, total: int):
        """更新代理池状态"""
        self.proxy_pool_size.labels(status='available').set(available)
        self.proxy_pool_size.labels(status='total').set(total)
    
    def update_storage_usage(self, storage_type: str, bytes_used: int):
        """更新存储使用量"""
        self.storage_usage.labels(storage_type=storage_type).set(bytes_used)
    
    def get_uptime(self) -> float:
        """获取运行时间"""
        return time.time() - self.start_time


# 全局指标实例
_metrics: Optional[CrawlerMetrics] = None


def get_metrics() -> CrawlerMetrics:
    """获取全局指标实例"""
    global _metrics
    if _metrics is None:
        _metrics = CrawlerMetrics()
    return _metrics


def init_metrics(port: int = 8000) -> CrawlerMetrics:
    """初始化指标系统"""
    global _metrics
    _metrics = CrawlerMetrics(port)
    _metrics.start_server()
    return _metrics
