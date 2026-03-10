"""
API v1 Routes
"""

from fastapi import APIRouter

from app.api.v1 import auth, users, projects, admin

api_router = APIRouter()

# 注册子路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户"])
api_router.include_router(projects.router, prefix="/projects", tags=["项目"])
api_router.include_router(admin.router, prefix="/admin", tags=["管理"])
