"""
Audit Log Model
审计日志模型
"""

from sqlalchemy import Column, BigInteger, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class AuditLog(Base):
    """审计日志表"""

    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)

    # 操作信息
    action = Column(String(100), nullable=False, index=True)  # login/create_project/delete_user 等
    resource_type = Column(String(50))
    resource_id = Column(BigInteger)

    # 详情
    details = Column(JSON)  # 额外的详细信息

    # 请求信息
    ip_address = Column(String(50))
    user_agent = Column(Text)

    # 时间
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # 关系
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id})>"
