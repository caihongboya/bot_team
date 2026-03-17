"""
User-Agent 轮换中间件
"""
import random
from scrapy.downloadermiddlewares.useragent import UserAgentMiddleware


class UserAgentRandomizerMiddleware(UserAgentMiddleware):
    """
    User-Agent 随机轮换中间件
    
    功能：
    - 从预定义的 UA 池中随机选择
    - 支持按域名配置偏好 UA
    - 定期更新 UA 池
    """
    
    # User-Agent 池
    USER_AGENTS = [
        # Chrome - Windows
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        
        # Chrome - macOS
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        
        # Firefox - Windows
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        
        # Firefox - macOS
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
        
        # Safari - macOS
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        
        # Edge - Windows
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        
        # Mobile - iOS
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        
        # Mobile - Android
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ]
    
    # 按域名配置的 UA 偏好
    DOMAIN_PREFERRED_UA = {
        'zh.wikipedia.org': [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ],
        'baike.baidu.com': [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ],
    }
    
    def __init__(self, settings=None):
        super().__init__(settings)
        # 可以从 settings 加载自定义 UA 池
        if settings and settings.get('USER_AGENT_POOL'):
            self.USER_AGENTS = settings['USER_AGENT_POOL']
    
    def process_request(self, request, spider):
        """
        处理每个请求，设置随机 User-Agent
        
        策略：
        1. 检查域名是否有偏好 UA
        2. 如果有，从偏好池中选择
        3. 否则，从全局池随机选择
        """
        from urllib.parse import urlparse
        
        # 解析域名
        parsed = urlparse(request.url)
        domain = parsed.netloc.lower()
        
        # 检查是否有域名特定的 UA
        if domain in self.DOMAIN_PREFERRED_UA:
            ua_pool = self.DOMAIN_PREFERRED_UA[domain]
            spider.logger.debug(f"Using domain-specific UA for {domain}")
        else:
            ua_pool = self.USER_AGENTS
        
        # 随机选择 UA
        user_agent = random.choice(ua_pool)
        request.headers['User-Agent'] = user_agent
        
        # 记录日志（调试用）
        spider.logger.debug(f"Set User-Agent: {user_agent[:50]}...")
        
        return None
    
    def add_user_agent(self, ua_string):
        """动态添加 User-Agent 到池中"""
        if ua_string not in self.USER_AGENTS:
            self.USER_AGENTS.append(ua_string)
    
    def remove_user_agent(self, ua_string):
        """从池中移除 User-Agent"""
        if ua_string in self.USER_AGENTS:
            self.USER_AGENTS.remove(ua_string)
