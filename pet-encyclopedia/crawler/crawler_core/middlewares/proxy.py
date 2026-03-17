"""
代理中间件 - IP 代理池管理
"""
import random
import aiohttp
import asyncio
from scrapy.downloadermiddlewares.httpproxy import HttpProxyMiddleware
from scrapy.exceptions import IgnoreRequest
from typing import List, Dict, Optional
from datetime import datetime, timedelta


class ProxyMiddleware(HttpProxyMiddleware):
    """
    代理中间件
    
    功能：
    - 代理 IP 动态轮换
    - 代理可用性实时监测
    - 失败自动切换 + 重试
    - 代理质量评分
    """
    
    def __init__(self, settings=None):
        super().__init__(settings)
        
        # 代理池
        self.proxy_pool: List[Dict] = []
        self.proxy_stats: Dict[str, Dict] = {}  # 代理使用统计
        
        # 配置
        self.pool_size = settings.get('PROXY_POOL_SIZE', 100) if settings else 100
        self.refresh_interval = settings.get('PROXY_REFRESH_INTERVAL', 300) if settings else 300
        self.max_failures = settings.get('PROXY_MAX_FAILURES', 3) if settings else 3
        self.timeout = settings.get('PROXY_TIMEOUT', 10) if settings else 10
        
        # 最后刷新时间
        self.last_refresh = datetime.now()
        
        # 日志
        self.logger = None
    
    def set_logger(self, logger):
        """设置日志记录器"""
        self.logger = logger
    
    async def fetch_proxies(self) -> List[str]:
        """
        从代理源获取代理列表
        
        实际使用时需要接入：
        - 自建代理服务器
        - 付费代理服务 API
        - 免费代理 API（需验证质量）
        """
        # 示例：从代理 API 获取
        # 实际部署时需要替换为真实接口
        proxy_sources = [
            # 'https://proxy-api.example.com/v1/proxies',
        ]
        
        proxies = []
        for source in proxy_sources:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(source, timeout=self.timeout) as response:
                        if response.status == 200:
                            data = await response.json()
                            # 解析代理列表
                            # 格式：['http://ip:port', 'http://user:pass@ip:port']
                            proxies.extend(data.get('proxies', []))
            except Exception as e:
                if self.logger:
                    self.logger.error(f"Failed to fetch proxies from {source}: {e}")
        
        return proxies
    
    def validate_proxy(self, proxy_url: str) -> bool:
        """
        验证代理可用性
        
        实际部署时应该异步批量验证
        """
        # 简化实现：假设所有代理都有效
        # 实际应该发送测试请求
        return True
    
    def get_proxy(self) -> Optional[str]:
        """
        从代理池获取一个可用代理
        
        策略：
        1. 过滤掉失败次数过多的代理
        2. 从剩余代理中随机选择
        3. 优先选择质量评分高的
        """
        # 过滤可用代理
        available_proxies = [
            p for p in self.proxy_pool
            if self.proxy_stats.get(p, {}).get('failures', 0) < self.max_failures
        ]
        
        if not available_proxies:
            if self.logger:
                self.logger.warning("No available proxies in pool")
            return None
        
        # 按质量评分排序（简单实现：失败次数少的优先）
        available_proxies.sort(
            key=lambda p: self.proxy_stats.get(p, {}).get('failures', 0)
        )
        
        # 从质量最好的前 50% 中随机选择
        top_half = available_proxies[:len(available_proxies) // 2 + 1]
        selected = random.choice(top_half)
        
        # 记录使用
        if selected not in self.proxy_stats:
            self.proxy_stats[selected] = {
                'uses': 0,
                'failures': 0,
                'last_used': None,
                'avg_response_time': 0,
            }
        
        self.proxy_stats[selected]['uses'] += 1
        self.proxy_stats[selected]['last_used'] = datetime.now()
        
        return selected
    
    def process_request(self, request, spider):
        """处理请求，设置代理"""
        # 检查是否需要刷新代理池
        if datetime.now() - self.last_refresh > timedelta(seconds=self.refresh_interval):
            self.refresh_proxy_pool()
        
        # 获取代理
        proxy = self.get_proxy()
        
        if proxy:
            request.meta['proxy'] = proxy
            if self.logger:
                self.logger.debug(f"Using proxy: {proxy}")
        else:
            if self.logger:
                self.logger.warning("No proxy available, proceeding without proxy")
        
        return None
    
    def process_exception(self, request, exception, spider):
        """
        处理代理请求异常
        
        - 记录失败
        - 标记代理为不可用
        """
        proxy = request.meta.get('proxy')
        
        if proxy:
            if proxy not in self.proxy_stats:
                self.proxy_stats[proxy] = {
                    'uses': 1,
                    'failures': 0,
                    'last_used': datetime.now(),
                }
            
            self.proxy_stats[proxy]['failures'] += 1
            
            if self.logger:
                self.logger.warning(
                    f"Proxy {proxy} failed ({self.proxy_stats[proxy]['failures']}/{self.max_failures}): {exception}"
                )
            
            # 如果失败次数过多，从池中移除
            if self.proxy_stats[proxy]['failures'] >= self.max_failures:
                if proxy in self.proxy_pool:
                    self.proxy_pool.remove(proxy)
                if self.logger:
                    self.logger.error(f"Proxy {proxy} removed from pool due to excessive failures")
        
        # 让 Scrapy 重试机制处理
        return None
    
    def refresh_proxy_pool(self):
        """刷新代理池"""
        if self.logger:
            self.logger.info("Refreshing proxy pool...")
        
        # 异步获取新代理
        # 注意：实际部署时应该使用异步方式
        try:
            loop = asyncio.get_event_loop()
            new_proxies = loop.run_until_complete(self.fetch_proxies())
            
            # 验证并添加到池中
            for proxy in new_proxies:
                if self.validate_proxy(proxy) and proxy not in self.proxy_pool:
                    if len(self.proxy_pool) >= self.pool_size:
                        # 池满，移除最旧的
                        self.proxy_pool.pop(0)
                    self.proxy_pool.append(proxy)
            
            self.last_refresh = datetime.now()
            
            if self.logger:
                self.logger.info(f"Proxy pool refreshed: {len(self.proxy_pool)} proxies")
        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to refresh proxy pool: {e}")
    
    def add_proxy(self, proxy_url: str):
        """手动添加代理到池中"""
        if proxy_url not in self.proxy_pool and len(self.proxy_pool) < self.pool_size * 2:
            self.proxy_pool.append(proxy_url)
            if self.logger:
                self.logger.info(f"Added proxy: {proxy_url}")
    
    def remove_proxy(self, proxy_url: str):
        """手动从池中移除代理"""
        if proxy_url in self.proxy_pool:
            self.proxy_pool.remove(proxy_url)
            if proxy_url in self.proxy_stats:
                del self.proxy_stats[proxy_url]
            if self.logger:
                self.logger.info(f"Removed proxy: {proxy_url}")
    
    def get_pool_stats(self) -> Dict:
        """获取代理池统计信息"""
        return {
            'total_proxies': len(self.proxy_pool),
            'available_proxies': len([
                p for p in self.proxy_pool
                if self.proxy_stats.get(p, {}).get('failures', 0) < self.max_failures
            ]),
            'total_failures': sum(
                s.get('failures', 0) for s in self.proxy_stats.values()
            ),
        }
