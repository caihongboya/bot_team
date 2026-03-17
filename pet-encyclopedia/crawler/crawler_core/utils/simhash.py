"""
SimHash 内容指纹工具
"""
import hashlib
import re
from typing import List, Tuple
from simhash import Simhash, SimhashIndex


class ContentFingerprint:
    """
    内容指纹生成和比对
    
    功能：
    - SimHash 指纹生成
    - 海明距离计算
    - 近似重复检测
    - 内容去重索引
    """
    
    def __init__(self, bits: int = 64, threshold: int = 3):
        """
        初始化
        
        Args:
            bits: SimHash 位数（64 或 128）
            threshold: 海明距离阈值（<=threshold 判定为重复）
        """
        self.bits = bits
        self.threshold = threshold
        self.index = SimhashIndex([], k=threshold)
    
    def generate_fingerprint(self, text: str) -> str:
        """
        生成内容指纹
        
        Args:
            text: 文本内容
        
        Returns:
            SimHash 指纹（16 进制字符串）
        """
        # 文本预处理
        features = self._extract_features(text)
        
        # 生成 SimHash
        simhash = Simhash(features, f=self.bits)
        
        return simhash.hexvalue()
    
    def _extract_features(self, text: str) -> List[int]:
        """
        提取文本特征
        
        使用 n-gram 特征
        """
        # 文本规范化
        text = self._normalize_text(text)
        
        # 分词（中文按字符）
        words = list(text)
        
        # 生成 3-gram 特征
        features = []
        for i in range(len(words) - 2):
            gram = ''.join(words[i:i+3])
            features.append(self._hash_feature(gram))
        
        return features
    
    def _normalize_text(self, text: str) -> str:
        """文本规范化"""
        # 转小写
        text = text.lower()
        
        # 移除空白字符
        text = re.sub(r'\s+', '', text)
        
        # 移除标点符号
        text = re.sub(r'[^\w\u4e00-\u9fff]', '', text)
        
        return text
    
    def _hash_feature(self, feature: str) -> int:
        """特征哈希"""
        return int(hashlib.md5(feature.encode('utf-8')).hexdigest(), 16)
    
    def is_duplicate(self, text1: str, text2: str) -> bool:
        """
        判断两段文本是否重复
        
        Args:
            text1: 文本 1
            text2: 文本 2
        
        Returns:
            是否重复
        """
        fp1 = self.generate_fingerprint(text1)
        fp2 = self.generate_fingerprint(text2)
        
        distance = self.hamming_distance(fp1, fp2)
        return distance <= self.threshold
    
    def hamming_distance(self, fp1: str, fp2: str) -> int:
        """
        计算海明距离
        
        Args:
            fp1: 指纹 1（16 进制）
            fp2: 指纹 2（16 进制）
        
        Returns:
            海明距离
        """
        # 转整数
        hash1 = int(fp1, 16)
        hash2 = int(fp2, 16)
        
        # XOR 计算不同位
        xor = hash1 ^ hash2
        
        # 计算 1 的个数
        distance = bin(xor).count('1')
        
        return distance
    
    def add_to_index(self, doc_id: str, text: str):
        """
        添加文档到索引
        
        Args:
            doc_id: 文档 ID
            text: 文档内容
        """
        fingerprint = self.generate_fingerprint(text)
        simhash = Simhash(int(fingerprint, 16), f=self.bits)
        self.index.add(doc_id, simhash)
    
    def find_duplicates(self, text: str) -> List[Tuple[str, int]]:
        """
        查找重复文档
        
        Args:
            text: 查询文本
        
        Returns:
            [(doc_id, distance), ...]
        """
        fingerprint = self.generate_fingerprint(text)
        simhash = Simhash(int(fingerprint, 16), f=self.bits)
        
        # 在索引中查找
        results = self.index.get_near_dups(simhash)
        
        # 计算精确距离
        duplicates = []
        for doc_id in results:
            stored_hash = self.index.get(doc_id)[0]
            distance = self.hamming_distance(fingerprint, stored_hash.hexvalue())
            duplicates.append((doc_id, distance))
        
        # 按距离排序
        duplicates.sort(key=lambda x: x[1])
        
        return duplicates


class RedisSimHashIndex:
    """
    基于 Redis 的 SimHash 索引
    
    用于分布式去重
    """
    
    def __init__(self, redis_client, key_prefix: str = 'pet:simhash'):
        """
        初始化
        
        Args:
            redis_client: Redis 客户端
            key_prefix: Redis key 前缀
        """
        self.redis = redis_client
        self.key_prefix = key_prefix
        self.fingerprint = ContentFingerprint()
    
    def add(self, doc_id: str, text: str):
        """添加文档"""
        fingerprint = self.fingerprint.generate_fingerprint(text)
        
        # 存储指纹
        key = f"{self.key_prefix}:doc:{doc_id}"
        self.redis.set(key, fingerprint)
        
        # 添加到索引（使用 Redis Set）
        index_key = f"{self.key_prefix}:index:{fingerprint}"
        self.redis.sadd(index_key, doc_id)
    
    def find_similar(self, text: str, threshold: int = 3) -> List[str]:
        """
        查找相似文档
        
        简化实现：仅精确匹配
        完整实现需要 Redis 位运算
        """
        fingerprint = self.fingerprint.generate_fingerprint(text)
        
        # 精确匹配
        index_key = f"{self.key_prefix}:index:{fingerprint}"
        doc_ids = self.redis.smembers(index_key)
        
        return list(doc_ids) if doc_ids else []
    
    def is_duplicate(self, text: str) -> bool:
        """检查是否重复"""
        similar_docs = self.find_similar(text)
        return len(similar_docs) > 0
