"""
基础 Spider 类 - 通用爬取逻辑
"""
import scrapy
from scrapy.spiders import Spider
from typing import Dict, List, Optional, Any
from datetime import datetime
import hashlib


class BaseSpider(Spider):
    """
    基础 Spider 类，提供通用爬取逻辑
    
    功能：
    - URL 规范化
    - 请求头设置
    - 错误处理
    - 日志记录
    - 监控埋点
    """
    
    # 子类需要覆盖的属性
    name = 'base'
    allowed_domains = []
    base_url = ''
    
    # 配置
    custom_settings = {}
    
    # 监控统计
    stats = {
        'pages_crawled': 0,
        'items_scraped': 0,
        'errors': 0,
        'retries': 0,
    }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.start_time = datetime.now()
        self.logger.info(f"Spider {self.name} started at {self.start_time}")
    
    def start_requests(self):
        """生成初始请求"""
        for url in self.start_urls:
            yield scrapy.Request(
                url=self.normalize_url(url),
                callback=self.parse,
                errback=self.handle_error,
                meta={
                    'crawl_depth': 0,
                    'crawl_time': datetime.now().isoformat(),
                },
            )
    
    def normalize_url(self, url: str) -> str:
        """
        URL 规范化
        
        - 转为小写
        - 移除 fragment
        - 标准化查询参数
        - 移除跟踪参数
        """
        from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
        
        parsed = urlparse(url)
        
        # 转为小写
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()
        path = parsed.path.lower()
        
        # 移除 fragment
        fragment = ''
        
        # 标准化查询参数
        query_params = parse_qs(parsed.query)
        # 移除跟踪参数
        tracking_params = ['utm_source', 'utm_medium', 'utm_campaign', 
                          'utm_term', 'utm_content', 'fbclid', 'gclid']
        for param in tracking_params:
            query_params.pop(param, None)
        
        # 排序参数
        query = urlencode(sorted(query_params.items()), doseq=True)
        
        normalized = urlunparse((scheme, netloc, path, parsed.params, query, fragment))
        return normalized
    
    def parse(self, response):
        """
        解析响应 - 子类需要实现
        
        默认行为：记录日志，返回空
        """
        self.stats['pages_crawled'] += 1
        self.logger.info(f"Parsed: {response.url} (status: {response.status})")
        
        # 子类应该覆盖此方法
        raise NotImplementedError("Subclasses must implement parse()")
    
    def handle_error(self, failure):
        """
        错误处理
        
        - 记录错误
        - 根据错误类型决定是否重试
        """
        self.stats['errors'] += 1
        self.logger.error(f"Error crawling {failure.request.url}: {failure.value}")
        
        # 可以在这里实现更复杂的错误处理逻辑
        return None
    
    def create_item(self, **kwargs) -> Dict[str, Any]:
        """
        创建标准 item
        
        包含元数据字段
        """
        item = {
            'url': kwargs.get('url', ''),
            'title': kwargs.get('title', ''),
            'content': kwargs.get('content', ''),
            'html': kwargs.get('html', ''),
            'source_site': self.name,
            'crawl_time': datetime.now().isoformat(),
            'spider_name': self.name,
            'metadata': kwargs.get('metadata', {}),
        }
        return item
    
    def generate_content_hash(self, content: str) -> str:
        """生成内容哈希（用于去重）"""
        return hashlib.md5(content.encode('utf-8')).hexdigest()
    
    def close(self, reason):
        """Spider 关闭时的清理工作"""
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()
        
        self.logger.info(f"Spider {self.name} closed: {reason}")
        self.logger.info(f"Duration: {duration:.2f}s")
        self.logger.info(f"Stats: {self.stats}")
        
        # 输出统计信息
        self.crawler.stats.set_value('pages_crawled', self.stats['pages_crawled'])
        self.crawler.stats.set_value('items_scraped', self.stats['items_scraped'])
        self.crawler.stats.set_value('errors', self.stats['errors'])
        
        return super().close(reason)
