"""
Role Model
角色模型
"""

from sqlalchemy import Column, Integer, String, Text, JSON, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Role(Base):
    """角色表"""

    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    description = Column(Text)
    permissions = Column(JSON, default=list)  # 权限列表 ["user.view", "user.create", ...]

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True))  # 软删除

    # 关系
    users = relationship("User", back_populates="role")

    def __repr__(self):
        return f"<Role(id={self.id}, name={self.name})>"

    def has_permission(self, permission: str) -> bool:
        """检查是否有某个权限"""
        if not self.permissions:
            return False
        # "*" 表示所有权限（超级管理员）
        if "*" in self.permissions:
            return True
        return permission in self.permissions

    def soft_delete(self):
        """软删除角色"""
        from datetime import datetime
        self.deleted_at = datetime.now()
