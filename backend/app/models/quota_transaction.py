"""
Quota Transaction Model
配额变动记录模型
"""

from sqlalchemy import Column, BigInteger, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class QuotaTransaction(Base):
    """配额变动记录表"""

    __tablename__ = "quota_transactions"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)

    # 变动信息
    type = Column(String(20), nullable=False, index=True)  # charge/consume/refund/gift
    amount = Column(Numeric(10, 2), nullable=False)  # 正数=增加，负数=减少
    balance_after = Column(Numeric(10, 2), nullable=False)  # 变动后余额

    # 关联
    related_type = Column(String(50))  # order/project/admin_operation
    related_id = Column(BigInteger)

    # 描述
    description = Column(Text)
    remark = Column(Text)  # 管理员操作必填备注

    # 操作人（管理员分配时记录操作员ID）
    operator_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)

    # 时间
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # 关系
    user = relationship("User", back_populates="quota_transactions", foreign_keys=[user_id])
    operator = relationship("User", foreign_keys=[operator_id])

    def __repr__(self):
        return f"<QuotaTransaction(id={self.id}, type={self.type}, amount={self.amount})>"

    @property
    def is_increase(self) -> bool:
        """是否是增加配额"""
        return float(self.amount) > 0

    @property
    def is_decrease(self) -> bool:
        """是否是减少配额"""
        return float(self.amount) < 0
