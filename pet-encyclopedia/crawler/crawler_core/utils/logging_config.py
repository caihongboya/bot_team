"""
日志配置工具
"""
import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from datetime import datetime


def setup_logging(
    log_level: str = 'INFO',
    log_dir: str = 'logs',
    log_file: str = 'crawler.log',
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5,
):
    """
    配置日志系统
    
    功能：
    - 控制台输出
    - 文件轮转
    - 按大小分割
    - 格式化输出
    """
    # 创建日志目录
    log_path = Path(log_dir)
    log_path.mkdir(exist_ok=True)
    
    # 日志格式
    log_format = '%(asctime)s [%(name)s] %(levelname)s: %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'
    
    # 根日志记录器
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # 清除现有处理器
    root_logger.handlers.clear()
    
    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_formatter = logging.Formatter(log_format, date_format)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # 文件处理器（按大小轮转）
    file_handler = RotatingFileHandler(
        log_path / log_file,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding='utf-8',
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(console_formatter)
    root_logger.addHandler(file_handler)
    
    # 错误日志单独文件
    error_handler = RotatingFileHandler(
        log_path / 'error.log',
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding='utf-8',
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(console_formatter)
    root_logger.addHandler(error_handler)
    
    # 第三方库日志级别调整
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)
    logging.getLogger('scrapy').setLevel(logging.INFO)
    
    return root_logger


class CrawlerLogger:
    """
    爬虫专用日志类
    
    提供结构化的日志记录
    """
    
    def __init__(self, spider_name: str):
        self.logger = logging.getLogger(f'crawler.{spider_name}')
        self.spider_name = spider_name
    
    def info(self, message: str, **kwargs):
        """信息日志"""
        extra = {'spider': self.spider_name, **kwargs}
        self.logger.info(message, extra=extra)
    
    def warning(self, message: str, **kwargs):
        """警告日志"""
        extra = {'spider': self.spider_name, **kwargs}
        self.logger.warning(message, extra=extra)
    
    def error(self, message: str, exc_info=False, **kwargs):
        """错误日志"""
        extra = {'spider': self.spider_name, **kwargs}
        self.logger.error(message, exc_info=exc_info, extra=extra)
    
    def debug(self, message: str, **kwargs):
        """调试日志"""
        extra = {'spider': self.spider_name, **kwargs}
        self.logger.debug(message, extra=extra)
    
    def crawl_stats(self, pages: int, items: int, errors: int, duration: float):
        """记录爬取统计"""
        self.info(
            f"Crawl stats: pages={pages}, items={items}, errors={errors}, duration={duration:.2f}s",
            pages=pages,
            items=items,
            errors=errors,
            duration=duration,
        )
