"""
Order Model
订单模型
"""

from sqlalchemy import Column, BigInteger, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Order(Base):
    """订单表"""

    __tablename__ = "orders"

    id = Column(BigInteger, primary_key=True, index=True)
    order_no = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)

    # 订单信息
    amount = Column(Numeric(10, 2), nullable=False)  # 支付金额（元）
    quota_amount = Column(Numeric(10, 2), nullable=False)  # 充值豆点数

    # 支付信息
    payment_method = Column(String(50))  # alipay/wechat/stripe
    payment_status = Column(String(20), default="pending", nullable=False, index=True)  # pending/paid/failed/refunded
    paid_at = Column(DateTime(timezone=True))

    # 第三方支付信息
    transaction_id = Column(String(200))  # 第三方支付订单号

    # 时间
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关系
    user = relationship("User", back_populates="orders")

    def __repr__(self):
        return f"<Order(id={self.id}, order_no={self.order_no}, status={self.payment_status})>"

    @property
    def is_paid(self) -> bool:
        """订单是否已支付"""
        return self.payment_status == "paid"

    @property
    def is_refunded(self) -> bool:
        """订单是否已退款"""
        return self.payment_status == "refunded"
