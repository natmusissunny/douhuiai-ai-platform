#!/bin/bash
#
# 数据库备份脚本
# Usage: ./scripts/backup.sh
#

set -e

# 配置
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# 加载环境变量
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# 设置默认值
POSTGRES_DB=${POSTGRES_DB:-douhuiai_db}
POSTGRES_USER=${POSTGRES_USER:-douhuiai}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🗄️  豆绘AI平台 - 数据库备份工具"
echo "=========================================="
echo ""

# 创建备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    echo "📁 创建备份目录: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# 检查Docker是否运行
if ! docker-compose ps | grep -q "douhuiai-postgres"; then
    echo -e "${RED}❌ 错误: PostgreSQL容器未运行${NC}"
    echo "请先启动服务: docker-compose up -d postgres"
    exit 1
fi

echo "📦 开始备份数据库..."
echo "  数据库: $POSTGRES_DB"
echo "  用户: $POSTGRES_USER"
echo "  时间: $DATE"
echo ""

# 备份PostgreSQL
POSTGRES_BACKUP_FILE="$BACKUP_DIR/postgres_${POSTGRES_DB}_$TIMESTAMP.sql"
echo "🔄 正在导出PostgreSQL数据..."

if docker-compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$POSTGRES_BACKUP_FILE"; then
    # 压缩备份文件
    echo "🗜️  正在压缩备份文件..."
    gzip "$POSTGRES_BACKUP_FILE"
    POSTGRES_BACKUP_FILE="${POSTGRES_BACKUP_FILE}.gz"

    # 获取文件大小
    FILESIZE=$(du -h "$POSTGRES_BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ PostgreSQL备份成功${NC}"
    echo "  文件: $POSTGRES_BACKUP_FILE"
    echo "  大小: $FILESIZE"
else
    echo -e "${RED}❌ PostgreSQL备份失败${NC}"
    exit 1
fi

echo ""

# 备份Redis (可选)
if docker-compose ps | grep -q "douhuiai-redis"; then
    echo "🔄 正在备份Redis数据..."
    REDIS_BACKUP_FILE="$BACKUP_DIR/redis_dump_$TIMESTAMP.rdb"

    # 触发Redis保存
    docker-compose exec -T redis redis-cli --raw SAVE > /dev/null 2>&1 || true
    sleep 2

    # 复制RDB文件
    if docker cp douhuiai-redis:/data/dump.rdb "$REDIS_BACKUP_FILE" 2>/dev/null; then
        FILESIZE=$(du -h "$REDIS_BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✅ Redis备份成功${NC}"
        echo "  文件: $REDIS_BACKUP_FILE"
        echo "  大小: $FILESIZE"
    else
        echo -e "${YELLOW}⚠️  Redis备份跳过 (无数据或权限不足)${NC}"
    fi
fi

echo ""

# 清理旧备份
echo "🧹 清理旧备份文件 (保留 ${BACKUP_RETENTION_DAYS} 天)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} -delete -print | wc -l | tr -d ' ')
DELETED_REDIS=$(find "$BACKUP_DIR" -name "*.rdb" -type f -mtime +${BACKUP_RETENTION_DAYS} -delete -print | wc -l | tr -d ' ')

if [ "$DELETED_COUNT" -gt 0 ] || [ "$DELETED_REDIS" -gt 0 ]; then
    echo "  删除了 $DELETED_COUNT 个PostgreSQL备份, $DELETED_REDIS 个Redis备份"
else
    echo "  没有需要清理的旧备份"
fi

echo ""

# 显示备份列表
echo "📋 当前备份文件列表:"
echo "----------------------------------------"
ls -lh "$BACKUP_DIR" | grep -E '\.(sql\.gz|rdb)$' | awk '{printf "  %s  %5s  %s\n", $6" "$7" "$8, $5, $9}' | tail -5
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo "----------------------------------------"
echo "  总计: $TOTAL_BACKUPS 个备份, 占用 $TOTAL_SIZE"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ 备份完成!${NC}"
echo "=========================================="
echo ""
echo "💡 提示:"
echo "  - 恢复备份: ./scripts/restore.sh <备份文件>"
echo "  - 查看备份: ls -lh $BACKUP_DIR"
echo "  - 定期备份: 添加到crontab (建议每天凌晨2点)"
echo "    0 2 * * * cd /path/to/project && ./scripts/backup.sh"
echo ""
