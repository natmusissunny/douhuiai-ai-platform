"""
用户相关的 Pydantic 模型
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class RoleBase(BaseModel):
    """角色基础模型"""
    id: int
    name: str
    permissions: List[str]

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    """用户基础模型"""
    id: int
    username: str
    email: EmailStr
    phone: Optional[str] = None
    quota_balance: Decimal
    status: str
    created_at: datetime
    role: RoleBase

    class Config:
        from_attributes = True


class UserProfile(UserBase):
    """用户个人信息响应"""
    pass


class UserUpdate(BaseModel):
    """用户更新请求"""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class QuotaInfo(BaseModel):
    """配额信息"""
    balance: Decimal
    total_used: Decimal
    total_recharged: Decimal


class QuotaTransactionItem(BaseModel):
    """配额交易记录"""
    id: int
    type: str
    amount: Decimal
    balance_after: Decimal
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
