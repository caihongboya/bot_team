"""
数据清洗 Pipeline
"""
from itemadapter import ItemAdapter
from typing import Dict, Any
import re
from readability import Document
from trafilatura import extract
import hashlib


class CleaningPipeline:
    """
    数据清洗 Pipeline
    
    功能：
    - HTML 正文提取
    - 噪声过滤
    - 文本规范化
    - 质量评分
    - Markdown 转换
    """
    
    # 噪声选择器黑名单
    NOISE_SELECTORS = [
        '.ad', '.advertisement', '.adsense',
        '.nav', '.header', '.footer', '.sidebar',
        '.comment', '.comments', '.reply',
        '.share', '.social', '.related',
        'script', 'style', 'noscript',
        '[class*="ad-"]', '[id*="ad-"]',
    ]
    
    # 质量评估阈值
    MIN_WORD_COUNT = 200
    MAX_LINK_DENSITY = 0.5
    MIN_TEXT_TO_HTML_RATIO = 0.3
    
    def process_item(self, item, spider):
        """处理每个 item"""
        adapter = ItemAdapter(item)
        
        # 只处理包含 HTML 的 item
        if 'html' not in adapter or not adapter.get('html'):
            return item
        
        html = adapter.get('html')
        url = adapter.get('url', '')
        
        # 1. 提取正文
        extracted = self.extract_content(html, url)
        
        if not extracted:
            spider.logger.warning(f"Failed to extract content from {url}")
            adapter['quality_score'] = 0
            return item
        
        # 2. 质量评估
        quality_score = self.evaluate_quality(extracted)
        adapter['quality_score'] = quality_score
        
        if quality_score < 0.6:
            spider.logger.warning(f"Low quality content ({quality_score:.2f}): {url}")
        
        # 3. 填充字段
        if 'content_html' in adapter and not adapter.get('content_html'):
            adapter['content_html'] = extracted.get('html', '')
        
        if 'content_text' in adapter and not adapter.get('content_text'):
            adapter['content_text'] = extracted.get('text', '')
        
        if 'title' in adapter and not adapter.get('title'):
            adapter['title'] = extracted.get('title', '')
        
        # 4. 计算字数
        text = extracted.get('text', '')
        adapter['word_count'] = len(text.split())
        
        # 5. 生成内容哈希
        adapter['content_hash'] = self.generate_content_hash(text)
        
        return item
    
    def extract_content(self, html: str, url: str) -> Dict[str, str]:
        """
        提取正文内容
        
        使用 Readability + Trafilatura 双重策略
        """
        try:
            # 方案 1: Readability（主要）
            doc = Document(html)
            title = doc.title()
            content_html = doc.summary()
            
            # 方案 2: Trafilatura（备选）
            text = extract(
                html,
                url=url,
                include_links=False,
                include_comments=False,
            )
            
            if not text or len(text) < 100:
                # 如果 Trafilatura 提取失败，从 Readability 结果提取纯文本
                text = re.sub(r'<[^>]+>', '', content_html)
            
            return {
                'title': title,
                'html': content_html,
                'text': text,
            }
            
        except Exception as e:
            print(f"Error extracting content: {e}")
            return None
    
    def evaluate_quality(self, extracted: Dict[str, str]) -> float:
        """
        评估内容质量
        
        评分维度：
        - 字数
        - 链接密度
        - 文本 HTML 比
        - 内容完整性
        """
        text = extracted.get('text', '')
        html = extracted.get('html', '')
        
        if not text or not html:
            return 0.0
        
        # 1. 字数评分（0-0.4）
        word_count = len(text.split())
        if word_count >= 1000:
            word_score = 0.4
        elif word_count >= 500:
            word_score = 0.3
        elif word_count >= 200:
            word_score = 0.2
        elif word_count >= 100:
            word_score = 0.1
        else:
            word_score = 0.0
        
        # 2. 链接密度评分（0-0.2）
        link_count = len(re.findall(r'<a[^>]+>', html))
        link_density = link_count / max(word_count, 1)
        if link_density <= 0.1:
            link_score = 0.2
        elif link_density <= 0.3:
            link_score = 0.15
        elif link_density <= 0.5:
            link_score = 0.1
        else:
            link_score = 0.0
        
        # 3. 文本 HTML 比评分（0-0.2）
        text_to_html_ratio = len(text) / max(len(html), 1)
        if text_to_html_ratio >= 0.5:
            ratio_score = 0.2
        elif text_to_html_ratio >= 0.3:
            ratio_score = 0.15
        elif text_to_html_ratio >= 0.2:
            ratio_score = 0.1
        else:
            ratio_score = 0.0
        
        # 4. 内容完整性评分（0-0.2）
        # 检查是否有标题、段落等
        completeness_score = 0.2
        if not extracted.get('title'):
            completeness_score -= 0.1
        if text.count('\n') < 3:  # 段落太少
            completeness_score -= 0.1
        
        # 总分
        total_score = word_score + link_score + ratio_score + completeness_score
        return min(total_score, 1.0)
    
    def generate_content_hash(self, text: str) -> str:
        """生成内容哈希（用于去重）"""
        # 文本规范化
        normalized = self.normalize_text(text)
        return hashlib.md5(normalized.encode('utf-8')).hexdigest()
    
    def normalize_text(self, text: str) -> str:
        """
        文本规范化
        
        - 去除多余空白
        - 统一标点
        - 转小写（可选）
        """
        # 去除多余空白
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        # 统一标点（中文标点转英文，可选）
        # text = text.replace('，', ',').replace('。', '.')
        
        return text
