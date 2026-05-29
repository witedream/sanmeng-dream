#!/bin/bash
# 梦女站 Dream Girl - 启动脚本
echo "🌸 正在启动梦女站..."

# 检查依赖
if ! python3 -c "from fastapi import FastAPI" 2>/dev/null; then
    echo "📦 安装依赖..."
    pip install --break-system-packages fastapi uvicorn sqlalchemy pydantic httpx python-multipart aiofiles
fi

# 启动服务器
cd "$(dirname "$0")/backend"
python3 main.py
