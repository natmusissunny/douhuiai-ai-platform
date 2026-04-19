"""
FastAPI Application Entry Point
主应用入口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from loguru import logger

from app.config import settings
from app.api.v1 import api_router

# 创建 FastAPI 应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="豆绘AI平台 - AI创意生成服务",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gzip 压缩中间件
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 注册路由
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
async def startup_event():
    """应用启动事件：自动建表 + 初始化种子数据"""
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} 启动")
    logger.info(f"🌍 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🐛 Debug Mode: {settings.DEBUG}")

    # 自动建表
    from app.database import init_db, SessionLocal
    init_db()
    logger.info("数据库表已同步")

    # 初始化种子数据（角色 + 默认用户），仅在表为空时执行
    from app.models.role import Role
    from app.models.user import User
    from app.utils.security import get_password_hash

    db = SessionLocal()
    try:
        if db.query(Role).count() == 0:
            logger.info("初始化默认角色...")
            roles = [
                Role(name="super_admin", display_name="超级管理员", description="拥有所有权限", permissions=["*"]),
                Role(name="admin", display_name="管理员", description="用户和内容管理", permissions=["user.*", "project.*", "stats.view", "role.view"]),
                Role(name="user", display_name="普通用户", description="普通用户", permissions=["project.create", "project.view", "user.view"]),
            ]
            db.add_all(roles)
            db.commit()
            logger.info(f"已创建 {len(roles)} 个角色")

        if db.query(User).count() == 0:
            logger.info("初始化默认用户...")
            admin_role = db.query(Role).filter(Role.name == "super_admin").first()
            user_role = db.query(Role).filter(Role.name == "user").first()
            users = [
                User(
                    username="admin", email="admin@douhuiai.com",
                    password_hash=get_password_hash("admin123"),
                    role_id=admin_role.id, quota_balance=10000.00,
                    status="active", is_verified=True,
                ),
                User(
                    username="testuser", email="test@douhuiai.com",
                    password_hash=get_password_hash("test123"),
                    role_id=user_role.id, quota_balance=100.00,
                    status="active", is_verified=True,
                ),
            ]
            db.add_all(users)
            db.commit()
            logger.info("已创建 admin(admin123) 和 testuser(test123)")
    except Exception as e:
        logger.error(f"种子数据初始化失败: {e}")
        db.rollback()
    finally:
        db.close()


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info(f"👋 {settings.APP_NAME} 关闭")


@app.get("/")
async def root():
    """根路径"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
