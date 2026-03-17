"""
基础测试 - 爬虫框架
"""
import pytest
from crawler_core.spiders.base import BaseSpider
from crawler_core.items import PetArticleItem


class TestBaseSpider:
    """测试基础 Spider 类"""
    
    def test_url_normalization(self):
        """测试 URL 规范化"""
        spider = BaseSpider()
        
        # 测试跟踪参数移除
        url = 'https://example.com/page?utm_source=google&utm_medium=cpc'
        normalized = spider.normalize_url(url)
        assert 'utm_' not in normalized
        
        # 测试 fragment 移除
        url = 'https://example.com/page#section1'
        normalized = spider.normalize_url(url)
        assert '#' not in normalized
        
        # 测试小写转换
        url = 'HTTPS://EXAMPLE.COM/Page'
        normalized = spider.normalize_url(url)
        assert normalized.islower()
    
    def test_content_hash(self):
        """测试内容哈希生成"""
        spider = BaseSpider()
        
        content1 = "Hello World"
        content2 = "Hello World"
        content3 = "Different Content"
        
        hash1 = spider.generate_content_hash(content1)
        hash2 = spider.generate_content_hash(content2)
        hash3 = spider.generate_content_hash(content3)
        
        assert hash1 == hash2
        assert hash1 != hash3
    
    def test_create_item(self):
        """测试 item 创建"""
        spider = BaseSpider()
        
        item = spider.create_item(
            url='https://example.com',
            title='Test Article',
            content='Test content',
        )
        
        assert item['url'] == 'https://example.com'
        assert item['title'] == 'Test Article'
        assert item['source_site'] == 'base'


class TestPetArticleItem:
    """测试 PetArticleItem"""
    
    def test_item_creation(self):
        """测试 item 创建"""
        item = PetArticleItem()
        
        item['title'] = 'Test'
        item['url'] = 'https://example.com'
        item['content_text'] = 'Content'
        
        assert item['title'] == 'Test'
        assert item['url'] == 'https://example.com'


class TestCleaning:
    """测试数据清洗"""
    
    def test_text_normalization(self):
        """测试文本规范化"""
        from crawler_core.pipelines.cleaning import CleaningPipeline
        
        pipeline = CleaningPipeline()
        
        text = "  Hello   World  "
        normalized = pipeline.normalize_text(text)
        
        assert normalized == "Hello World"


class TestSimHash:
    """测试 SimHash 去重"""
    
    def test_fingerprint_generation(self):
        """测试指纹生成"""
        from crawler_core.utils.simhash import ContentFingerprint
        
        fp = ContentFingerprint()
        
        text1 = "这是一段测试文本"
        text2 = "这是一段测试文本"
        text3 = "完全不同的内容"
        
        hash1 = fp.generate_fingerprint(text1)
        hash2 = fp.generate_fingerprint(text2)
        hash3 = fp.generate_fingerprint(text3)
        
        assert hash1 == hash2
        assert hash1 != hash3
    
    def test_duplicate_detection(self):
        """测试重复检测"""
        from crawler_core.utils.simhash import ContentFingerprint
        
        fp = ContentFingerprint()
        
        text1 = "猫是一种可爱的动物，喜欢抓老鼠。"
        text2 = "猫是一种可爱的动物，喜欢抓老鼠。"
        text3 = "狗是人类的好朋友，非常忠诚。"
        
        assert fp.is_duplicate(text1, text2) == True
        assert fp.is_duplicate(text1, text3) == False


class TestUserAgentMiddleware:
    """测试 User-Agent 中间件"""
    
    def test_ua_rotation(self):
        """测试 UA 轮换"""
        from crawler_core.middlewares.useragent import UserAgentRandomizerMiddleware
        
        middleware = UserAgentRandomizerMiddleware()
        
        # 收集 100 个 UA
        uas = set()
        for _ in range(100):
            uas.add(middleware.USER_AGENTS[_ % len(middleware.USER_AGENTS)])
        
        # 应该有多个不同的 UA
        assert len(uas) > 1


class TestProxyMiddleware:
    """测试代理中间件"""
    
    def test_proxy_pool(self):
        """测试代理池"""
        from crawler_core.middlewares.proxy import ProxyMiddleware
        
        middleware = ProxyMiddleware()
        
        # 添加测试代理
        middleware.add_proxy('http://proxy1.example.com:8080')
        middleware.add_proxy('http://proxy2.example.com:8080')
        
        # 获取代理
        proxy = middleware.get_proxy()
        assert proxy is not None
        
        # 获取统计
        stats = middleware.get_pool_stats()
        assert stats['total_proxies'] == 2


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
