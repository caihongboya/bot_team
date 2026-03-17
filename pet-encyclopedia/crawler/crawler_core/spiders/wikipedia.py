"""
维基百科 Spider - 宠物条目爬取
"""
import scrapy
from crawler_core.spiders.base import BaseSpider
from crawler_core.items import PetArticleItem
from urllib.parse import urljoin
import re


class WikipediaPetSpider(BaseSpider):
    """
    维基百科宠物条目 Spider
    
    目标：
    - 爬取宠物相关百科条目
    - 提取品种、养护、健康等内容
    """
    
    name = 'wikipedia_pet'
    allowed_domains = ['zh.wikipedia.org']
    base_url = 'https://zh.wikipedia.org'
    
    # 起始 URL（宠物分类）
    start_urls = [
        'https://zh.wikipedia.org/wiki/Category:宠物',
    ]
    
    # 自定义设置
    custom_settings = {
        'DOWNLOAD_DELAY': 0.5,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 4,
        'ROBOTSTXT_OBEY': True,
    }
    
    # 目标关键词
    pet_keywords = [
        '猫', '狗', '犬', '宠物', '饲养', '品种',
        '猫咪', '狗狗', '幼犬', '幼猫',
    ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.visited_categories = set()
    
    def parse(self, response):
        """解析页面"""
        self.stats['pages_crawled'] += 1
        
        # 判断页面类型
        if '/wiki/Category:' in response.url:
            # 分类页
            yield from self.parse_category(response)
        elif '/wiki/' in response.url:
            # 条目页
            yield from self.parse_article(response)
    
    def parse_category(self, response):
        """解析分类页"""
        category_name = response.url.split('/wiki/Category:')[-1]
        
        if category_name in self.visited_categories:
            return
        
        self.visited_categories.add(category_name)
        self.logger.info(f"Parsing category: {category_name}")
        
        # 提取子分类
        subcategories = response.css('#mw-subcategories a[href*="/wiki/Category:"]::attr(href)').getall()
        for subcat in subcategories[:10]:  # 限制子分类数量
            yield response.follow(
                url=subcat,
                callback=self.parse_category,
                meta={'crawl_depth': response.meta.get('crawl_depth', 0) + 1},
            )
        
        # 提取条目链接
        pages = response.css('#mw-pages a[href*="/wiki/"]:not([href*="/wiki/Category:"])::attr(href)').getall()
        for page in pages:
            if self.is_pet_related(page):
                yield response.follow(
                    url=page,
                    callback=self.parse_article,
                    meta={'crawl_depth': response.meta.get('crawl_depth', 0) + 1},
                )
        
        # 下一页
        next_page = response.css('a.mw-nextlink::attr(href)').get()
        if next_page:
            yield response.follow(
                url=next_page,
                callback=self.parse_category,
            )
    
    def parse_article(self, response):
        """解析条目页"""
        self.logger.debug(f"Parsing article: {response.url}")
        
        # 提取标题
        title = response.css('h1.firstHeading::text').get()
        if not title:
            return
        
        # 提取正文内容
        content_div = response.css('#mw-content-text')
        
        # 移除不需要的部分
        for selector in ['.navbox', '.toc', '#catlinks', '.printfooter', '.ambox']:
            content_div.css(selector).remove()
        
        # 提取摘要
        summary = content_div.css('.lemma-summary, p').getall()
        summary_html = ''.join(summary[:10])  # 限制段落数量
        
        # 提取完整内容
        content_html = content_div.get()
        
        # 提取纯文本
        content_text = content_div.css('::text').getall()
        content_text = ' '.join([t.strip() for t in content_text if t.strip()])
        
        # 提取图片
        images = []
        for img in response.css('#mw-content-text img'):
            img_src = img.attrib.get('src')
            if img_src and not img_src.startswith('data:'):
                images.append({
                    'url': urljoin(response.url, img_src),
                    'alt': img.attrib.get('alt', ''),
                })
        
        # 提取分类
        categories = response.css('#catlinks a::text').getall()
        
        # 创建 item
        item = PetArticleItem()
        item['url'] = response.url
        item['title'] = title.strip()
        item['slug'] = self.generate_slug(title)
        item['content_html'] = summary_html
        item['content_text'] = content_text[:10000]  # 限制长度
        item['source_site'] = 'wikipedia'
        item['source_url'] = response.url
        item['category'] = self.extract_category(categories)
        item['tags'] = categories[:5] if categories else []
        item['images'] = images[:5]  # 限制图片数量
        item['language'] = 'zh'
        
        yield item
        
        self.stats['items_scraped'] += 1
    
    def is_pet_related(self, url: str) -> bool:
        """判断 URL 是否与宠物相关"""
        # 简单关键词匹配
        for keyword in self.pet_keywords:
            if keyword in url.lower():
                return True
        return False
    
    def generate_slug(self, title: str) -> str:
        """生成 URL slug"""
        # 移除特殊字符
        slug = re.sub(r'[^\w\s\u4e00-\u9fff]', '', title)
        # 替换空格为连字符
        slug = slug.replace(' ', '-')
        # 转小写
        slug = slug.lower()
        return slug[:200]  # 限制长度
    
    def extract_category(self, categories: list) -> str:
        """从分类中提取主分类"""
        if not categories:
            return 'uncategorized'
        
        # 优先匹配
        for cat in categories:
            if '猫' in cat:
                return 'cat'
            elif '狗' in cat or '犬' in cat:
                return 'dog'
            elif '宠物' in cat:
                return 'pet'
        
        return 'general'
