"""
Item 定义 - 数据结构
"""
import scrapy
from itemloaders.processors import TakeFirst, MapCompose, Join
from w3lib.html import remove_tags
from datetime import datetime


def strip_text(text):
    """去除文本前后空格"""
    if text:
        return text.strip()
    return text


def parse_datetime(dt_str):
    """解析日期时间字符串"""
    if not dt_str:
        return datetime.now()
    try:
        return datetime.fromisoformat(dt_str)
    except:
        return datetime.now()


class PetArticleItem(scrapy.Item):
    """宠物文章 Item"""
    
    # 基本信息
    url = scrapy.Field()
    title = scrapy.Field(
        input_processor=MapCompose(strip_text),
        output_processor=TakeFirst(),
    )
    slug = scrapy.Field()
    
    # 内容
    content_html = scrapy.Field()
    content_md = scrapy.Field()
    content_text = scrapy.Field(
        input_processor=MapCompose(remove_tags, strip_text),
    )
    
    # 元数据
    source_site = scrapy.Field()
    source_url = scrapy.Field()
    author = scrapy.Field(
        input_processor=MapCompose(strip_text),
    )
    publish_date = scrapy.Field(
        input_processor=MapCompose(parse_datetime),
    )
    
    # 分类和标签
    category = scrapy.Field()
    sub_category = scrapy.Field()
    tags = scrapy.Field()
    
    # 图片
    images = scrapy.Field()  # List[Dict]
    cover_image = scrapy.Field()
    
    # 爬取元数据
    crawl_time = scrapy.Field(
        input_processor=MapCompose(parse_datetime),
    )
    spider_name = scrapy.Field()
    proxy_used = scrapy.Field()
    retry_count = scrapy.Field()
    
    # 去重指纹
    content_hash = scrapy.Field()
    url_hash = scrapy.Field()
    
    # 质量评分
    quality_score = scrapy.Field()
    word_count = scrapy.Field()
    
    # 审核状态
    status = scrapy.Field()  # draft/review/published
    review_status = scrapy.Field()  # pending/approved/rejected
    review_notes = scrapy.Field()


class RawHTMLItem(scrapy.Item):
    """原始 HTML Item - 用于存储完整页面"""
    
    url = scrapy.Field()
    html = scrapy.Field()
    status_code = scrapy.Field()
    headers = scrapy.Field()
    cookies = scrapy.Field()
    
    # 爬取元数据
    crawl_time = scrapy.Field()
    spider_name = scrapy.Field()
    proxy_used = scrapy.Field()
    retry_count = scrapy.Field()
    
    # 去重
    content_hash = scrapy.Field()
    
    # 页面元数据
    title = scrapy.Field()
    description = scrapy.Field()
    keywords = scrapy.Field()
    language = scrapy.Field()


class ImageItem(scrapy.Item):
    """图片 Item"""
    
    url = scrapy.Field()
    image_url = scrapy.Field()
    alt = scrapy.Field()
    width = scrapy.Field()
    height = scrapy.Field()
    
    # 关联文章
    article_url = scrapy.Field()
    article_id = scrapy.Field()
    
    # 存储信息
    storage_path = scrapy.Field()
    storage_bucket = scrapy.Field()
    file_size = scrapy.Field()
    file_format = scrapy.Field()
    
    # 处理状态
    processed = scrapy.Field()
    thumbnail_path = scrapy.Field()
