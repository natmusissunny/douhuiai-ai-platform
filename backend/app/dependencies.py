"""
FastAPI 依赖注入
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.utils.security import decode_token
from app.models.user import User

# HTTP Bearer 认证
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    获取当前登录用户

    Args:
        credentials: HTTP Bearer Token
        db: 数据库会话

    Returns:
        User: 当前用户对象

    Raises:
        HTTPException: 如果 Token 无效或用户不存在
    """
    token = credentials.credentials

    # 解码 Token
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 获取用户 ID（JWT 中 sub 存储为字符串，需要转换为 int）
    raw_user_id = payload.get("sub")
    if raw_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_id = int(raw_user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 查询用户
    user = db.query(User).filter(User.id == user_id, User.deleted_at == None).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 检查用户状态
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.status}",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    获取当前活跃用户

    Args:
        current_user: 当前用户

    Returns:
        User: 当前活跃用户

    Raises:
        HTTPException: 如果用户不活跃
    """
    if current_user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user


def require_permission(permission: str):
    """
    权限检查装饰器

    Args:
        permission: 需要的权限字符串

    Returns:
        依赖函数
    """

    async def permission_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        """检查用户是否有指定权限"""
        if not current_user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No role assigned",
            )

        if not current_user.role.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}",
            )

        return current_user

    return permission_checker
