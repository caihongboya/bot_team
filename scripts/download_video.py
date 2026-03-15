#!/usr/bin/env python3
"""
通用短视频下载脚本 - 支持小红书等平台
用法：python3 download_video.py <URL>
"""

import sys
import re
import json
import urllib.request
import urllib.parse
import socket
import os

# 强制使用 IPv4 并绕过代理
socket.getaddrinfo = lambda *args: [(socket.AF_INET, socket.SOCK_STREAM, 6, '', (args[0], args[1]))]
os.environ['no_proxy'] = '*'
os.environ['NO_PROXY'] = '*'

def fetch_url(url, headers=None):
    """获取网页内容"""
    if headers is None:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"❌ 获取网页失败：{e}")
        return None

def extract_video_from_xiaohongshu(html):
    """从小红书网页提取视频"""
    # 方法 1: 找 video 标签
    video_patterns = [
        r'<video[^>]*src=["\']([^"\']*\.mp4[^"\']*)["\']',
        r'"videoUrl":["\']([^"\']+)["\']',
        r'"originVideoKey":["\']([^"\']+)["\']',
        r'(https?://[^"\s]*xhscdn\.com[^"\s]*\.mp4[^"\s]*)',
        r'(https?://[^"\s]*video[^"\s]*\.mp4[^"\s]*)',
    ]
    
    for pattern in video_patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        if matches:
            return matches[0]
    
    # 方法 2: 找 JSON 数据中的视频 URL
    json_matches = re.findall(r'window\.__INITIAL_STATE__\s*=\s*({.+?});', html)
    if json_matches:
        try:
            data = json.loads(json_matches[0])
            # 尝试从数据结构中找视频
            if 'note' in data:
                note = data['note']
                if 'video' in note:
                    video = note['video']
                    if 'url' in video:
                        return video['url']
                    if 'consumer' in video and 'originVideoKey' in video['consumer']:
                        key = video['consumer']['originVideoKey']
                        return f"https://sns-video-bd.xhscdn.com/{key}"
        except:
            pass
    
    return None

def download_file(url, output_path=None):
    """下载文件"""
    if not output_path:
        output_path = f"/tmp/video_{url.split('/')[-1][:20]}.mp4"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.xiaohongshu.com/',
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            with open(output_path, 'wb') as f:
                f.write(response.read())
        return output_path
    except Exception as e:
        print(f"❌ 下载失败：{e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("用法：python3 download_video.py <URL>")
        sys.exit(1)
    
    url = sys.argv[1]
    print(f"🔍 分析链接：{url}")
    
    # 获取网页内容
    html = fetch_url(url)
    if not html:
        sys.exit(1)
    
    print(f"✅ 获取到 {len(html)} 字节内容")
    
    # 提取视频 URL
    video_url = extract_video_from_xiaohongshu(html)
    
    if video_url:
        print(f"🎯 找到视频：{video_url[:100]}...")
        
        # 下载视频
        output = download_file(video_url)
        if output:
            print(f"✅ 视频已保存到：{output}")
        else:
            print(f"📹 视频 URL: {video_url}")
            print("   可以手动用 wget 或浏览器下载")
    else:
        print("❌ 未找到视频链接")
        print("\n可能的原因:")
        print("1. 视频已被删除或设为私密")
        print("2. 需要登录才能查看")
        print("3. 页面结构已更新")

if __name__ == "__main__":
    main()
