"""
User API Routes
用户相关API
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.quota_transaction import QuotaTransaction
from app.schemas.user import UserProfile, UserUpdate, QuotaInfo, QuotaTransactionItem

router = APIRouter()


@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    """
    获取当前用户信息

    Returns:
        UserProfile: 用户个人信息
    """
    return current_user


@router.put("/profile", response_model=UserProfile)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    更新用户信息

    - **email**: 新邮箱 (可选)
    - **phone**: 新手机号 (可选)
    """
    # 如果更新邮箱,检查邮箱是否已被使用
    if user_update.email and user_update.email != current_user.email:
        existing_email = db.query(User).filter(
            User.email == user_update.email, User.id != current_user.id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        current_user.email = user_update.email

    # 更新手机号
    if user_update.phone is not None:
        current_user.phone = user_update.phone

    db.commit()
    db.refresh(current_user)

    return current_user


@router.get("/quota", response_model=QuotaInfo)
async def get_quota(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    获取配额信息

    Returns:
        QuotaInfo: 配额余额和使用情况
    """
    # 计算总充值
    total_recharged = (
        db.query(QuotaTransaction)
        .filter(
            QuotaTransaction.user_id == current_user.id,
            QuotaTransaction.type == "recharge",
        )
        .with_entities(QuotaTransaction.amount)
        .scalar()
        or 0
    )

    # 计算总消耗
    total_used = (
        db.query(QuotaTransaction)
        .filter(
            QuotaTransaction.user_id == current_user.id,
            QuotaTransaction.type.in_(["consume", "refund"]),
        )
        .with_entities(QuotaTransaction.amount)
        .scalar()
        or 0
    )

    return {
        "balance": current_user.quota_balance,
        "total_recharged": total_recharged,
        "total_used": abs(total_used),
    }


@router.get("/quota/history", response_model=List[QuotaTransactionItem])
async def get_quota_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
):
    """
    获取配额变动历史

    - **skip**: 跳过记录数 (默认0)
    - **limit**: 返回记录数 (默认20, 最大100)

    Returns:
        List[QuotaTransactionItem]: 配额交易记录列表
    """
    if limit > 100:
        limit = 100

    transactions = (
        db.query(QuotaTransaction)
        .filter(QuotaTransaction.user_id == current_user.id)
        .order_by(QuotaTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return transactions
