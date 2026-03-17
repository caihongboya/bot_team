"""
自定义重试中间件
"""
from scrapy.downloadermiddlewares.retry import RetryMiddleware
from scrapy.exceptions import IgnoreRequest
from scrapy.http import Request
from typing import Optional
from datetime import datetime, timedelta


class CustomRetryMiddleware(RetryMiddleware):
    """
    自定义重试中间件
    
    功能：
    - 指数退避重试
    - 分站点重试策略
    - 重试日志记录
    - 失败队列管理
    """
    
    # 分站点重试配置
    DOMAIN_RETRY_CONFIG = {
        'default': {
            'max_retries': 3,
            'base_delay': 1,
            'max_delay': 60,
            'exponential_base': 2,
        },
        'baike.baidu.com': {
            'max_retries': 5,
            'base_delay': 2,
            'max_delay': 120,
            'exponential_base': 2,
        },
        'zh.wikipedia.org': {
            'max_retries': 3,
            'base_delay': 1,
            'max_delay': 30,
            'exponential_base': 2,
        },
    }
    
    def process_response(self, request, response, spider):
        """处理响应，决定是否重试"""
        # 检查是否需要重试
        if request.meta.get('dont_retry', False):
            return response
        
        # 检查状态码
        if response.status in self.retry_http_codes:
            reason = f"HTTP status code {response.status}"
            return self._retry(request, reason, spider) or response
        
        return response
    
    def process_exception(self, request, exception, spider):
        """处理异常，决定是否重试"""
        if isinstance(exception, self.EXCEPTIONS_TO_RETRY):
            return self._retry(request, str(exception), spider)
        
        return None
    
    def _retry(self, request, reason, spider):
        """
        执行重试逻辑
        
        使用指数退避策略
        """
        # 获取域名配置
        from urllib.parse import urlparse
        domain = urlparse(request.url).netloc.lower()
        
        config = self.DOMAIN_RETRY_CONFIG.get(
            domain,
            self.DOMAIN_RETRY_CONFIG['default']
        )
        
        max_retries = config['max_retries']
        base_delay = config['base_delay']
        max_delay = config['max_delay']
        exp_base = config['exponential_base']
        
        # 获取当前重试次数
        retry_count = request.meta.get('retry_count', 0)
        
        # 检查是否超过最大重试次数
        if retry_count >= max_retries:
            spider.logger.warning(
                f"Gave up retrying {request.url} (failed {retry_count} times): {reason}"
            )
            return None
        
        # 计算重试延迟（指数退避 + 随机抖动）
        import random
        delay = min(base_delay * (exp_base ** retry_count), max_delay)
        delay *= (0.5 + random.random())  # 50%-150% 随机抖动
        
        # 创建重试请求
        new_request = request.copy()
        new_request.meta['retry_count'] = retry_count + 1
        new_request.meta['retry_reason'] = reason
        new_request.meta['retry_delay'] = delay
        new_request.dont_filter = True  # 不过滤器
        
        # 设置优先级（降低优先级）
        new_request.priority = request.priority - self.priority_adjust
        
        # 记录日志
        spider.logger.info(
            f"Retrying {request.url} (attempt {retry_count + 1}/{max_retries}) "
            f"after {delay:.2f}s: {reason}"
        )
        
        # 延迟执行（使用 meta 传递延迟信息）
        # 注意：Scrapy 本身不支持延迟调度，需要配合调度器或使用 scrapy-deltafetch
        # 这里简单返回请求，实际延迟由调度器处理
        
        return new_request
    
    def get_exception_to_retry(self, exception):
        """判断异常是否应该重试"""
        # 网络相关异常
        network_exceptions = [
            'ConnectionRefusedError',
            'ConnectionResetError',
            'TimeoutError',
            'socket.timeout',
            'socket.error',
        ]
        
        exc_name = type(exception).__name__
        if any(name in exc_name for name in network_exceptions):
            return True
        
        # DNS 解析失败
        if 'DNS' in str(exception):
            return True
        
        return False
