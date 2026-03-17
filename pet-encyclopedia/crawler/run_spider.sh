#!/bin/bash
# 爬虫运行脚本
# 使用示例：./run_spider.sh wikipedia_pet

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="/home/kite/.openclaw/workspace/pet-encyclopedia"
CRAWLER_DIR="$PROJECT_DIR/crawler"

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查虚拟环境
check_venv() {
    if [ ! -d "$PROJECT_DIR/venv" ]; then
        log_error "虚拟环境不存在，请先创建：python3 -m venv $PROJECT_DIR/venv"
        exit 1
    fi
}

# 激活虚拟环境
activate_venv() {
    source "$PROJECT_DIR/venv/bin/activate"
    log_info "虚拟环境已激活"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! python -c "import scrapy" 2>/dev/null; then
        log_warn "Scrapy 未安装，正在安装..."
        pip install -q -r "$CRAWLER_DIR/requirements.txt"
    fi
    
    log_info "依赖检查完成"
}

# 运行爬虫
run_spider() {
    local spider_name=$1
    local log_level=${2:-INFO}
    local page_limit=${3:-}
    
    cd "$CRAWLER_DIR"
    
    log_info "启动爬虫：$spider_name"
    log_info "日志级别：$log_level"
    
    # 构建命令
    cmd="scrapy crawl $spider_name -L $log_level"
    
    if [ -n "$page_limit" ]; then
        cmd="$cmd -s CLOSESPIDER_PAGECOUNT=$page_limit"
        log_info "页数限制：$page_limit"
    fi
    
    # 运行
    log_info "执行：$cmd"
    eval $cmd
}

# 显示帮助
show_help() {
    echo "用法：$0 <spider_name> [log_level] [page_limit]"
    echo ""
    echo "参数:"
    echo "  spider_name   Spider 名称（如：wikipedia_pet）"
    echo "  log_level     日志级别（DEBUG/INFO/WARNING/ERROR），默认：INFO"
    echo "  page_limit    爬取页数限制（可选）"
    echo ""
    echo "示例:"
    echo "  $0 wikipedia_pet"
    echo "  $0 wikipedia_pet DEBUG"
    echo "  $0 wikipedia_pet INFO 100"
    echo ""
    echo "可用 Spider:"
    echo "  - wikipedia_pet: 维基百科宠物条目"
}

# 主函数
main() {
    if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
        show_help
        exit 0
    fi
    
    if [ -z "$1" ]; then
        log_error "请指定 Spider 名称"
        show_help
        exit 1
    fi
    
    check_venv
    activate_venv
    check_dependencies
    run_spider "$1" "${2:-INFO}" "${3:-}"
}

# 执行
main "$@"
