"""
数据存储 Pipeline - MongoDB + PostgreSQL
"""
from itemadapter import ItemAdapter
from typing import Dict, Any, List
from datetime import datetime
import json


class MongoDBPipeline:
    """
    MongoDB Pipeline - 存储原始 HTML
    
    用于：
    - 保存完整页面快照
    - 后续重新处理
    - 审计和调试
    """
    
    def __init__(self, mongo_uri, mongo_db):
        self.mongo_uri = mongo_uri
        self.mongo_db = mongo_db
        self.client = None
        self.db = None
        self.collection = None
    
    @classmethod
    def from_crawler(cls, crawler):
        pipeline = cls(
            mongo_uri=crawler.settings.get('MONGODB_URI', 'mongodb://localhost:27017/'),
            mongo_db=crawler.settings.get('MONGODB_DB', 'pet_encyclopedia_raw'),
        )
        pipeline.logger = crawler.logger
        return pipeline
    
    def open_spider(self, spider):
        """Spider 打开时连接数据库"""
        try:
            from pymongo import MongoClient
            
            self.client = MongoClient(self.mongo_uri)
            self.db = self.client[self.mongo_db]
            self.collection = self.db['raw_html']
            
            # 创建索引
            self.collection.create_index('url', unique=True)
            self.collection.create_index('crawl_time')
            self.collection.create_index('spider_name')
            
            spider.logger.info(f"Connected to MongoDB: {self.mongo_db}")
        except Exception as e:
            spider.logger.error(f"Failed to connect to MongoDB: {e}")
    
    def close_spider(self, spider):
        """Spider 关闭时断开连接"""
        if self.client:
            self.client.close()
            spider.logger.info("Disconnected from MongoDB")
    
    def process_item(self, item, spider):
        """处理 item，存储到 MongoDB"""
        adapter = ItemAdapter(item)
        
        # 构建文档
        doc = {
            'url': adapter.get('url', ''),
            'html': adapter.get('html', ''),
            'title': adapter.get('title', ''),
            'status_code': adapter.get('status_code', 200),
            'headers': dict(adapter.get('headers', {})),
            'crawl_time': datetime.fromisoformat(adapter.get('crawl_time', datetime.now().isoformat())),
            'spider_name': adapter.get('spider_name', spider.name),
            'proxy_used': adapter.get('proxy_used'),
            'retry_count': adapter.get('retry_count', 0),
            'content_hash': adapter.get('content_hash'),
            'metadata': {
                'description': adapter.get('description', ''),
                'keywords': adapter.get('keywords', ''),
                'language': adapter.get('language', 'zh'),
            },
        }
        
        try:
            # 使用 upsert 避免重复
            self.collection.update_one(
                {'url': doc['url']},
                {'$set': doc},
                upsert=True,
            )
            spider.logger.debug(f"Stored raw HTML: {doc['url']}")
        except Exception as e:
            spider.logger.error(f"Failed to store to MongoDB: {e}")
        
        return item


class PostgreSQLPipeline:
    """
    PostgreSQL Pipeline - 存储结构化内容
    
    用于：
    - 存储清洗后的结构化数据
    - 支持复杂查询
    - 支持事务
    """
    
    def __init__(self, postgres_uri):
        self.postgres_uri = postgres_uri
        self.conn = None
        self.cur = None
    
    @classmethod
    def from_crawler(cls, crawler):
        pipeline = cls(
            postgres_uri=crawler.settings.get('POSTGRES_URI', 'postgresql://localhost/pet_encyclopedia'),
        )
        pipeline.logger = crawler.logger
        return pipeline
    
    def open_spider(self, spider):
        """Spider 打开时连接数据库"""
        try:
            import psycopg2
            from psycopg2.extras import Json
            
            self.conn = psycopg2.connect(self.postgres_uri)
            self.cur = self.conn.cursor()
            
            # 创建表（如果不存在）
            self.create_tables()
            
            spider.logger.info("Connected to PostgreSQL")
        except Exception as e:
            spider.logger.error(f"Failed to connect to PostgreSQL: {e}")
    
    def close_spider(self, spider):
        """Spider 关闭时断开连接"""
        if self.cur:
            self.cur.close()
        if self.conn:
            self.conn.close()
            spider.logger.info("Disconnected from PostgreSQL")
    
    def create_tables(self):
        """创建数据表"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS articles (
            id SERIAL PRIMARY KEY,
            title VARCHAR(500) NOT NULL,
            slug VARCHAR(500) UNIQUE,
            content_md TEXT,
            content_html TEXT,
            content_text TEXT,
            source_url VARCHAR(2000),
            source_site VARCHAR(100),
            author VARCHAR(200),
            publish_date TIMESTAMP,
            category VARCHAR(100),
            sub_category VARCHAR(100),
            tags TEXT[],
            images JSONB,
            cover_image VARCHAR(2000),
            word_count INTEGER,
            quality_score REAL,
            status VARCHAR(20) DEFAULT 'draft',
            review_status VARCHAR(20) DEFAULT 'pending',
            review_notes TEXT,
            crawl_time TIMESTAMP,
            spider_name VARCHAR(100),
            content_hash VARCHAR(64) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
        CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
        CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
        CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash);
        CREATE INDEX IF NOT EXISTS idx_articles_crawl_time ON articles(crawl_time);
        """
        
        self.cur.execute(create_table_sql)
        self.conn.commit()
    
    def process_item(self, item, spider):
        """处理 item，存储到 PostgreSQL"""
        adapter = ItemAdapter(item)
        
        # 只处理有内容的 item
        if not adapter.get('content_text'):
            return item
        
        # 构建插入数据
        insert_sql = """
        INSERT INTO articles (
            title, slug, content_md, content_html, content_text,
            source_url, source_site, author, publish_date,
            category, sub_category, tags, images, cover_image,
            word_count, quality_score, status, review_status,
            crawl_time, spider_name, content_hash
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (content_hash) DO UPDATE SET
            title = EXCLUDED.title,
            content_md = EXCLUDED.content_md,
            content_html = EXCLUDED.content_html,
            word_count = EXCLUDED.word_count,
            quality_score = EXCLUDED.quality_score,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id;
        """
        
        values = (
            adapter.get('title', ''),
            adapter.get('slug'),
            adapter.get('content_md'),
            adapter.get('content_html'),
            adapter.get('content_text'),
            adapter.get('url') or adapter.get('source_url'),
            adapter.get('source_site'),
            adapter.get('author'),
            adapter.get('publish_date'),
            adapter.get('category'),
            adapter.get('sub_category'),
            adapter.get('tags'),
            Json(adapter.get('images', [])),
            adapter.get('cover_image'),
            adapter.get('word_count'),
            adapter.get('quality_score'),
            adapter.get('status', 'draft'),
            adapter.get('review_status', 'pending'),
            datetime.fromisoformat(adapter.get('crawl_time')) if adapter.get('crawl_time') else datetime.now(),
            adapter.get('spider_name', spider.name),
            adapter.get('content_hash'),
        )
        
        try:
            self.cur.execute(insert_sql, values)
            article_id = self.cur.fetchone()[0]
            self.conn.commit()
            
            spider.logger.info(f"Stored article to PostgreSQL: ID={article_id}, {adapter.get('title', '')[:50]}")
        except Exception as e:
            spider.logger.error(f"Failed to store to PostgreSQL: {e}")
            self.conn.rollback()
        
        return item
