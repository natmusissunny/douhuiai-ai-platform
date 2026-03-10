"""
User Model
用户模型
"""

from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    """用户表"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)

    nickname = Column(String(100))
    avatar_url = Column(String(500))

    # 配额
    quota_balance = Column(Numeric(10, 2), default=0.00, nullable=False)
    quota_limit = Column(Numeric(10, 2), default=None)    # 总额度上限，NULL=不限制
    monthly_quota = Column(Numeric(10, 2), default=None)  # 月度配额上限，NULL=不限制

    # 角色
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)

    # 状态
    status = Column(String(20), default="active", nullable=False, index=True)  # active/disabled/banned
    is_verified = Column(Boolean, default=False, nullable=False)

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))
    deleted_at = Column(DateTime(timezone=True))  # 软删除

    # 关系
    role = relationship("Role", back_populates="users")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    quota_transactions = relationship("QuotaTransaction", back_populates="user", cascade="all, delete-orphan", foreign_keys="QuotaTransaction.user_id")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username})>"

    @property
    def is_active(self) -> bool:
        """用户是否激活"""
        return self.status == "active" and self.deleted_at is None

    def has_permission(self, permission: str) -> bool:
        """检查用户是否有某个权限"""
        if not self.role:
            return False
        return self.role.has_permission(permission)
