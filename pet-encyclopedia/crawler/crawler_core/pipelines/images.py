"""
图片下载 Pipeline
"""
from itemadapter import ItemAdapter
from typing import Dict, List
from datetime import datetime
import os
import hashlib
from urllib.parse import urljoin, urlparse


class ImageDownloadPipeline:
    """
    图片下载 Pipeline
    
    功能：
    - 提取页面图片
    - 下载并处理图片
    - 上传到 MinIO 存储
    - 生成缩略图
    """
    
    def __init__(self, minio_endpoint, minio_access_key, minio_secret_key, minio_bucket, minio_secure):
        self.minio_endpoint = minio_endpoint
        self.minio_access_key = minio_access_key
        self.minio_secret_key = minio_secret_key
        self.minio_bucket = minio_bucket
        self.minio_secure = minio_secure
        
        self.minio_client = None
        self.download_path = 'downloads/images'
        
        # 创建下载目录
        os.makedirs(self.download_path, exist_ok=True)
    
    @classmethod
    def from_crawler(cls, crawler):
        pipeline = cls(
            minio_endpoint=crawler.settings.get('MINIO_ENDPOINT', 'localhost:9000'),
            minio_access_key=crawler.settings.get('MINIO_ACCESS_KEY', 'minioadmin'),
            minio_secret_key=crawler.settings.get('MINIO_SECRET_KEY', 'minioadmin'),
            minio_bucket=crawler.settings.get('MINIO_BUCKET', 'pet-encyclopedia'),
            minio_secure=crawler.settings.get('MINIO_SECURE', False),
        )
        pipeline.logger = crawler.logger
        return pipeline
    
    def open_spider(self, spider):
        """Spider 打开时初始化 MinIO 客户端"""
        try:
            from minio import Minio
            
            self.minio_client = Minio(
                self.minio_endpoint,
                access_key=self.minio_access_key,
                secret_key=self.minio_secret_key,
                secure=self.minio_secure,
            )
            
            # 创建 bucket（如果不存在）
            if not self.minio_client.bucket_exists(self.minio_bucket):
                self.minio_client.make_bucket(self.minio_bucket)
            
            spider.logger.info(f"Connected to MinIO: {self.minio_bucket}")
        except Exception as e:
            spider.logger.error(f"Failed to connect to MinIO: {e}")
    
    def close_spider(self, spider):
        """Spider 关闭时清理"""
        pass
    
    def process_item(self, item, spider):
        """处理 item，下载图片"""
        adapter = ItemAdapter(item)
        
        # 提取图片
        html = adapter.get('content_html') or adapter.get('html')
        if not html:
            return item
        
        base_url = adapter.get('url', '')
        images = self.extract_images(html, base_url)
        
        if not images:
            return item
        
        # 下载并处理图片
        processed_images = []
        for img in images[:10]:  # 限制每篇文章最多 10 张图
            try:
                result = self.download_and_process_image(img, spider)
                if result:
                    processed_images.append(result)
            except Exception as e:
                spider.logger.warning(f"Failed to download image {img.get('url')}: {e}")
        
        # 更新 item
        adapter['images'] = processed_images
        
        # 设置封面图（第一张）
        if processed_images and not adapter.get('cover_image'):
            adapter['cover_image'] = processed_images[0].get('storage_path')
        
        return item
    
    def extract_images(self, html: str, base_url: str) -> List[Dict]:
        """从 HTML 中提取图片"""
        from bs4 import BeautifulSoup
        
        soup = BeautifulSoup(html, 'lxml')
        images = []
        
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src')
            if not src:
                continue
            
            # 跳过 data URL
            if src.startswith('data:'):
                continue
            
            # 转换为绝对 URL
            img_url = urljoin(base_url, src)
            
            images.append({
                'url': img_url,
                'alt': img.get('alt', ''),
                'width': img.get('width'),
                'height': img.get('height'),
            })
        
        return images
    
    def download_and_process_image(self, img: Dict, spider) -> Dict:
        """下载并处理单张图片"""
        import requests
        from PIL import Image
        import io
        
        img_url = img.get('url')
        if not img_url:
            return None
        
        # 下载图片
        try:
            response = requests.get(img_url, timeout=30)
            response.raise_for_status()
        except Exception as e:
            spider.logger.warning(f"Failed to download {img_url}: {e}")
            return None
        
        # 处理图片
        try:
            image_bytes = response.content
            processed_bytes, format = self.process_image(image_bytes)
        except Exception as e:
            spider.logger.warning(f"Failed to process image: {e}")
            processed_bytes = image_bytes
            format = 'jpeg'
        
        # 生成存储路径
        file_hash = hashlib.md5(image_bytes).hexdigest()
        date_str = datetime.now().strftime('%Y%m%d')
        storage_path = f"images/{date_str}/{file_hash}.{format}"
        
        # 上传到 MinIO
        try:
            self.upload_to_minio(storage_path, processed_bytes, format)
        except Exception as e:
            spider.logger.error(f"Failed to upload to MinIO: {e}")
            return None
        
        # 生成缩略图
        thumbnail_path = None
        try:
            thumbnail_bytes = self.generate_thumbnail(processed_bytes)
            thumbnail_path = storage_path.replace(f'.{format}', '_thumb.webp')
            self.upload_to_minio(thumbnail_path, thumbnail_bytes, 'webp')
        except Exception as e:
            spider.logger.warning(f"Failed to generate thumbnail: {e}")
        
        return {
            'original_url': img_url,
            'storage_path': storage_path,
            'thumbnail_path': thumbnail_path,
            'alt': img.get('alt', ''),
            'format': format,
            'size': len(processed_bytes),
        }
    
    def process_image(self, image_bytes: bytes, max_width: int = 1920, quality: int = 85):
        """
        处理图片
        
        - 格式转换（转 WebP）
        - 尺寸调整
        - 压缩优化
        """
        from PIL import Image
        
        img = Image.open(io.BytesIO(image_bytes))
        
        # 转换模式
        if img.mode in ('RGBA', 'LA', 'P'):
            output_format = 'png'
        else:
            output_format = 'webp'
        
        # 尺寸调整
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.LANCZOS)
        
        # 压缩输出
        output = io.BytesIO()
        if output_format == 'webp':
            img.save(output, format='WEBP', quality=quality, optimize=True)
        else:
            img.save(output, format='PNG', optimize=True)
        
        return output.getvalue(), output_format
    
    def generate_thumbnail(self, image_bytes: bytes, size: int = 300):
        """生成缩略图"""
        from PIL import Image
        import io
        
        img = Image.open(io.BytesIO(image_bytes))
        
        # 生成缩略图
        img.thumbnail((size, size), Image.LANCZOS)
        
        # 输出 WebP
        output = io.BytesIO()
        img.save(output, format='WEBP', quality=80, optimize=True)
        
        return output.getvalue()
    
    def upload_to_minio(self, object_path: str, data: bytes, content_type: str):
        """上传数据到 MinIO"""
        from minio.error import S3Error
        
        try:
            self.minio_client.put_object(
                self.minio_bucket,
                object_path,
                io.BytesIO(data),
                length=len(data),
                content_type=f'image/{content_type}',
            )
        except S3Error as e:
            raise e
    
    def get_image_url(self, storage_path: str) -> str:
        """获取图片访问 URL"""
        # 如果有 CDN，返回 CDN URL
        # 否则返回 MinIO URL
        protocol = 'https' if self.minio_secure else 'http'
        return f"{protocol}://{self.minio_endpoint}/{self.minio_bucket}/{storage_path}"


# 导入 io 用于 MinIO 上传
import io
