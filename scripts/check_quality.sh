#!/bin/bash
#
# 代码质量检查脚本
# Usage: ./scripts/check_quality.sh
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🔍 豆绘AI平台 - 代码质量检查"
echo "=========================================="
echo ""

ERRORS=0

# 检查Python代码
echo "${BLUE}📝 检查Python代码...${NC}"
echo ""

# Black - 代码格式
echo "1️⃣  Black (代码格式化检查)"
if docker-compose exec -T backend black --check app/ tests/ 2>&1; then
    echo -e "${GREEN}✅ Black检查通过${NC}"
else
    echo -e "${YELLOW}⚠️  格式问题，运行 'make format' 自动修复${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# isort - 导入排序
echo "2️⃣  isort (导入排序检查)"
if docker-compose exec -T backend isort --check-only app/ tests/ 2>&1; then
    echo -e "${GREEN}✅ isort检查通过${NC}"
else
    echo -e "${YELLOW}⚠️  导入顺序问题，运行 'make format' 自动修复${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Flake8 - 代码规范
echo "3️⃣  Flake8 (代码规范检查)"
if docker-compose exec -T backend flake8 app/ tests/ 2>&1; then
    echo -e "${GREEN}✅ Flake8检查通过${NC}"
else
    echo -e "${RED}❌ 代码规范问题，请手动修复${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# mypy - 类型检查
echo "4️⃣  mypy (类型检查)"
if docker-compose exec -T backend mypy app/ --ignore-missing-imports 2>&1 | grep -E "(Success|error)" ; then
    if docker-compose exec -T backend mypy app/ --ignore-missing-imports 2>&1 | grep -q "Success" ; then
        echo -e "${GREEN}✅ mypy检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️  类型提示问题，建议修复${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  mypy检查跳过${NC}"
fi
echo ""

# 运行测试
echo "${BLUE}🧪 运行测试...${NC}"
echo ""

echo "5️⃣  pytest (单元测试)"
if docker-compose exec -T backend pytest tests/ -v --tb=short 2>&1 | tail -20; then
    echo -e "${GREEN}✅ 测试通过${NC}"
else
    echo -e "${RED}❌ 测试失败${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 测试覆盖率
echo "6️⃣  Coverage (测试覆盖率)"
COVERAGE=$(docker-compose exec -T backend pytest tests/ --cov=app --cov-report=term-missing 2>&1 | grep "TOTAL" | awk '{print $4}' | sed 's/%//')

if [ ! -z "$COVERAGE" ]; then
    echo "测试覆盖率: ${COVERAGE}%"
    if [ $(echo "$COVERAGE >= 70" | bc -l 2>/dev/null || echo 0) -eq 1 ]; then
        echo -e "${GREEN}✅ 覆盖率达标 (>= 70%)${NC}"
    else
        echo -e "${YELLOW}⚠️  覆盖率偏低 (< 70%)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  无法获取覆盖率数据${NC}"
fi
echo ""

# 安全检查 (可选)
echo "${BLUE}🔒 安全检查...${NC}"
echo ""

echo "7️⃣  Safety (依赖安全检查)"
if docker-compose exec -T backend pip list --format=json | docker run -i --rm pyupio/safety check --stdin 2>&1 | grep -E "(vulnerabilities|No known security vulnerabilities)" | head -1; then
    echo -e "${GREEN}✅ 安全检查通过${NC}"
else
    echo -e "${YELLOW}⚠️  Safety检查跳过 (可选)${NC}"
fi
echo ""

# 统计信息
echo "=========================================="
echo "${BLUE}📊 代码统计${NC}"
echo "=========================================="

# Python代码行数
PY_LINES=$(find backend/app -name "*.py" -type f -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "N/A")
echo "Python代码: ${PY_LINES} 行"

# 测试代码行数
TEST_LINES=$(find backend/tests -name "*.py" -type f -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "N/A")
echo "测试代码: ${TEST_LINES} 行"

# API端点数量
API_COUNT=$(grep -r "@router\." backend/app/api --include="*.py" | wc -l | tr -d ' ' || echo "N/A")
echo "API端点: ${API_COUNT} 个"

echo ""

# 总结
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有检查通过!${NC}"
    echo "=========================================="
    exit 0
else
    echo -e "${YELLOW}⚠️  发现 ${ERRORS} 个问题${NC}"
    echo "=========================================="
    echo ""
    echo "修复建议:"
    echo "  - 格式化代码: make format"
    echo "  - 运行测试: make test"
    echo "  - 查看详情: docker-compose logs backend"
    exit 1
fi
