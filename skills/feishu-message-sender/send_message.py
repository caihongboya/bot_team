#!/usr/bin/env python3
"""
飞书消息发送工具
用于通过飞书向用户发送消息
"""

import json
import os

def send_feishu_message(user_open_id, message_content):
    """
    发送飞书消息给指定用户
    
    Args:
        user_open_id (str): 用户的open_id
        message_content (str): 消息内容
    
    Returns:
        dict: 发送结果
    """
    # 在实际环境中，这里会调用飞书API
    # 为演示目的，我们返回一个模拟的响应
    
    result = {
        "success": True,
        "message": f"已向用户 {user_open_id} 发送消息: {message_content}",
        "timestamp": "2026-03-14T17:05:00+08:00"
    }
    
    return result

def main():
    # 由于没有实际的用户授权，我们模拟一个场景
    print("飞书消息发送工具")
    print("=" * 30)
    
    # 模拟用户信息（在实际环境中应从飞书API获取）
    user_info = {
        "open_id": "ou_xxx",  # 实际使用中应该从飞书API获取
        "name": "老板"
    }
    
    message = "你好！我是小龙虾，已收到你的消息。"
    
    # 发送消息
    result = send_feishu_message(user_info["open_id"], message)
    
    print(f"发送结果: {json.dumps(result, ensure_ascii=False, indent=2)}")

if __name__ == "__main__":
    main()