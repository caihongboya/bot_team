"""
去重中间件 - URL 和内容去重
"""
import hashlib
import redis
from typing import Optional, Set
from scrapy.http import Request
from scrapy.spiders import Spider


class DedupMiddleware:
    """
    Spider 中间件 - URL 去重
    
    功能：
    - 使用 Redis Bloom Filter 进行 URL 去重
    - 支持分布式去重
    - 可配置去重策略
    """
    
    def __init__(self, settings=None):
        """初始化去重中间件"""
        self.enabled = True
        
        if settings:
            # Redis 配置
            redis_host = settings.get('REDIS_HOST', 'localhost')
            redis_port = settings.get('REDIS_PORT', 6379)
            redis_db = settings.get('REDIS_DB', 0)
            
            # Bloom Filter 配置
            self.bloom_key = settings.get('BLOOM_FILTER_KEY', 'pet:urls:bloom')
            self.capacity = settings.get('DEDUP_BLOOM_FILTER_CAPACITY', 100_000_000)
            self.error_rate = settings.get('DEDUP_BLOOM_FILTER_ERROR_RATE', 0.001)
            
            # 去重策略
            self.dedup_strategy = settings.get('DEDUP_STRATEGY', 'url')  # url, content, both
            
            # 连接 Redis
            try:
                self.redis_client = redis.Redis(
                    host=redis_host,
                    port=redis_port,
                    db=redis_db,
                    decode_responses=True,
                )
                # 测试连接
                self.redis_client.ping()
            except Exception as e:
                print(f"Failed to connect to Redis: {e}")
                self.enabled = False
                self.redis_client = None
        else:
            self.enabled = False
            self.redis_client = None
    
    @classmethod
    def from_crawler(cls, crawler):
        """从 crawler 创建中间件实例"""
        middleware = cls(crawler.settings)
        middleware.logger = crawler.logger
        return middleware
    
    def process_spider_output(self, response, result, spider):
        """
        处理 spider 输出，过滤重复的 Request
        
        对每个生成的 Request 检查 URL 是否已爬取
        """
        for item in result:
            if isinstance(item, Request):
                if self.is_duplicate_url(item.url, spider):
                    spider.logger.debug(f"Duplicate URL filtered: {item.url}")
                    continue
            yield item
    
    def is_duplicate_url(self, url: str, spider: Spider) -> bool:
        """
        检查 URL 是否重复
        
        使用 Redis Bloom Filter 进行高效去重
        """
        if not self.enabled or not self.redis_client:
            return False
        
        try:
            # URL 规范化
            normalized_url = self.normalize_url(url)
            url_hash = self.hash_url(normalized_url)
            
            # 检查 Bloom Filter
            # RedisBloom 命令：BF.EXISTS key item
            exists = self.redis_client.execute_command(
                'BF.EXISTS', self.bloom_key, url_hash
            )
            
            if exists:
                # URL 已存在（可能有误判，但概率极低）
                return True
            
            # 添加到 Bloom Filter
            # RedisBloom 命令：BF.ADD key item
            self.redis_client.execute_command(
                'BF.ADD', self.bloom_key, url_hash
            )
            
            return False
            
        except Exception as e:
            spider.logger.error(f"Error checking URL dedup: {e}")
            # 出错时不过滤，避免误杀
            return False
    
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
        tracking_params = [
            'utm_source', 'utm_medium', 'utm_campaign',
            'utm_term', 'utm_content', 'fbclid', 'gclid',
        ]
        for param in tracking_params:
            query_params.pop(param, None)
        
        # 排序参数
        query = urlencode(sorted(query_params.items()), doseq=True)
        
        normalized = urlunparse((scheme, netloc, path, parsed.params, query, fragment))
        return normalized
    
    def hash_url(self, url: str) -> str:
        """生成 URL 哈希"""
        return hashlib.md5(url.encode('utf-8')).hexdigest()
    
    def is_duplicate_content(self, content_hash: str, spider: Spider) -> bool:
        """
        检查内容是否重复（基于 SimHash）
        
        这个方法应该在 Pipeline 中调用，用于内容去重
        """
        if not self.enabled or not self.redis_client:
            return False
        
        try:
            content_key = f"pet:content:{content_hash}"
            exists = self.redis_client.exists(content_key)
            
            if exists:
                return True
            
            # 标记为已存在（设置过期时间，例如 30 天）
            self.redis_client.setex(content_key, 30 * 86400, '1')
            
            return False
            
        except Exception as e:
            spider.logger.error(f"Error checking content dedup: {e}")
            return False
    
    def get_stats(self) -> dict:
        """获取去重统计"""
        if not self.enabled or not self.redis_client:
            return {}
        
        try:
            # 获取 Bloom Filter 统计
            info = self.redis_client.execute_command('BF.INFO', self.bloom_key)
            return {
                'bloom_filter_items': info[1] if len(info) > 1 else 0,
                'bloom_filter_capacity': info[3] if len(info) > 3 else self.capacity,
            }
        except Exception:
            return {}
