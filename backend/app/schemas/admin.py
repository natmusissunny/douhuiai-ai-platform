"""
管理员相关的 Pydantic 模型
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import datetime
from decimal import Decimal


class RoleBasic(BaseModel):
    """角色基础信息（嵌套用）"""
    id: int
    name: str

    class Config:
        from_attributes = True


class UserListItem(BaseModel):
    """用户列表项"""
    id: int
    username: str
    email: EmailStr
    phone: Optional[str]
    quota_balance: Decimal
    quota_limit: Optional[Decimal]
    monthly_quota: Optional[Decimal]
    role: RoleBasic
    status: str
    created_at: datetime
    last_login_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """用户列表响应"""
    total: int
    items: List[UserListItem]


class UserDetailResponse(BaseModel):
    """用户详情响应"""
    id: int
    username: str
    email: EmailStr
    phone: Optional[str]
    quota_balance: Decimal
    role: RoleBasic
    status: str
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime]
    project_count: int
    total_quota_used: Decimal

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """管理员创建用户"""
    username: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    nickname: Optional[str] = None
    role_id: int
    quota_balance: Decimal = Decimal("0")
    quota_limit: Optional[Decimal] = None
    monthly_quota: Optional[Decimal] = None
    status: str = "active"


class UserUpdate(BaseModel):
    """管理员更新用户信息"""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    nickname: Optional[str] = None
    role_id: Optional[int] = None
    quota_limit: Optional[Decimal] = None
    monthly_quota: Optional[Decimal] = None
    status: Optional[str] = None


class UserStatusUpdate(BaseModel):
    """更新用户状态"""
    status: str  # active/disabled/banned


class UserQuotaAdjust(BaseModel):
    """管理员调整用户配额（支持 set/add/subtract）"""
    op: Literal["set", "add", "subtract"]  # 操作类型
    amount: Decimal                          # 金额（set=设置为，add/subtract=变动量，均为正数）
    remark: str                              # 操作备注（必填）


class UserQuotaUpdate(BaseModel):
    """更新用户配额（旧接口兼容）"""
    amount: Decimal
    description: Optional[str] = "管理员充值"


class TransactionListItem(BaseModel):
    """流水记录列表项"""
    id: int
    user_id: int
    username: str
    type: str
    amount: Decimal
    balance_after: Decimal
    remark: Optional[str]
    description: Optional[str]
    operator_id: Optional[int]
    operator_username: Optional[str]
    related_type: Optional[str]
    related_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    """流水记录响应"""
    total: int
    items: List[TransactionListItem]


class ApiBalanceResponse(BaseModel):
    """豆绘 API 账户余额"""
    balance: float
    app_id: str
    warning: bool        # 是否低余额告警（< 100）
    warning_threshold: float = 100.0


class RoleListItem(BaseModel):
    """角色列表项"""
    id: int
    name: str
    description: Optional[str]
    permissions: List[str]
    user_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class RoleCreate(BaseModel):
    """创建角色"""
    name: str
    description: Optional[str]
    permissions: List[str]


class RoleUpdate(BaseModel):
    """更新角色"""
    name: Optional[str]
    description: Optional[str]
    permissions: Optional[List[str]]


class SystemStats(BaseModel):
    """系统统计"""
    total_users: int
    active_users: int
    total_projects: int
    projects_today: int
    projects_this_month: int
    total_quota_consumed: Decimal
    quota_consumed_today: Decimal
    quota_consumed_this_month: Decimal


class ProjectStats(BaseModel):
    """项目统计"""
    by_type: dict  # {type: count}
    by_status: dict  # {status: count}
    success_rate: float
    avg_processing_time: float  # 秒


class QuotaStats(BaseModel):
    """配额统计"""
    total_recharged: Decimal
    total_consumed: Decimal
    total_refunded: Decimal
    balance: Decimal
    transactions_today: int
    transactions_this_month: int
