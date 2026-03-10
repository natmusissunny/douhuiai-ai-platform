#!/bin/bash
#
# 数据库恢复脚本
# Usage: ./scripts/restore.sh <backup_file>
#

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🔄 豆绘AI平台 - 数据库恢复工具"
echo "=========================================="
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}❌ 错误: 请指定备份文件${NC}"
    echo ""
    echo "用法: $0 <backup_file>"
    echo ""
    echo "可用的备份文件:"
    ls -lh ./backups/*.sql.gz 2>/dev/null | awk '{printf "  %s  %5s  %s\n", $6" "$7" "$8, $5, $9}' || echo "  (无备份文件)"
    exit 1
fi

BACKUP_FILE="$1"

# 检查文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ 错误: 备份文件不存在: $BACKUP_FILE${NC}"
    exit 1
fi

# 加载环境变量
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

POSTGRES_DB=${POSTGRES_DB:-douhuiai_db}
POSTGRES_USER=${POSTGRES_USER:-douhuiai}

echo "⚠️  警告: 此操作将删除现有数据库并恢复到备份状态"
echo ""
echo "  数据库: $POSTGRES_DB"
echo "  备份文件: $BACKUP_FILE"
echo "  文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

# 确认操作
read -p "确定要继续吗? (输入 'yes' 确认): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}❌ 操作已取消${NC}"
    exit 0
fi

echo ""

# 检查Docker是否运行
if ! docker-compose ps | grep -q "douhuiai-postgres"; then
    echo -e "${RED}❌ 错误: PostgreSQL容器未运行${NC}"
    echo "请先启动服务: docker-compose up -d postgres"
    exit 1
fi

# 停止应用服务
echo "⏸️  停止应用服务..."
docker-compose stop backend celery-worker celery-beat 2>/dev/null || true

echo ""

# 解压备份文件 (如果是压缩的)
TEMP_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "🗜️  解压备份文件..."
    TEMP_FILE="/tmp/restore_temp_$$.sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
fi

# 删除现有数据库
echo "🗑️  删除现有数据库..."
docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" 2>/dev/null || true

# 创建新数据库
echo "📦 创建新数据库..."
docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;" || {
    echo -e "${RED}❌ 创建数据库失败${NC}"
    exit 1
}

# 恢复数据
echo "🔄 正在恢复数据..."
if docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$TEMP_FILE"; then
    echo -e "${GREEN}✅ 数据恢复成功${NC}"
else
    echo -e "${RED}❌ 数据恢复失败${NC}"
    [ "$TEMP_FILE" != "$BACKUP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
fi

# 清理临时文件
if [ "$TEMP_FILE" != "$BACKUP_FILE" ]; then
    rm -f "$TEMP_FILE"
fi

echo ""

# 启动应用服务
echo "▶️  启动应用服务..."
docker-compose start backend celery-worker celery-beat

echo ""
echo "=========================================="
echo -e "${GREEN}✅ 恢复完成!${NC}"
echo "=========================================="
echo ""
echo "💡 建议:"
echo "  - 检查应用状态: docker-compose ps"
echo "  - 查看应用日志: docker-compose logs -f backend"
echo "  - 访问应用: http://localhost:8000"
echo ""
