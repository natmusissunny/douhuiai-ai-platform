"""
Project Model
项目/任务模型
"""

from sqlalchemy import Column, Integer, BigInteger, String, Text, Numeric, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Project(Base):
    """项目/任务表"""

    __tablename__ = "projects"

    id = Column(BigInteger, primary_key=True, index=True)
    uuid = Column(String(100), unique=True, nullable=False, index=True)  # 外部任务ID
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)

    # 类型
    type = Column(String(50), nullable=False, index=True)  # text2img/img2img/edit/3d_render
    subtype = Column(String(50))  # upscale/remove_bg/style_transfer 等

    # 输入参数
    input_params = Column(JSON, nullable=False)  # 存储所有输入参数

    # 状态
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending/processing/completed/failed
    progress = Column(Integer, default=0)  # 0-100

    # 结果
    result_url = Column(Text)  # 单张图片结果
    result_urls = Column(JSON)  # 多张图片结果数组
    thumbnail_url = Column(Text)
    error_message = Column(Text)

    # 配额
    quota_cost = Column(Numeric(10, 2), default=0.00, nullable=False)

    # 时间
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    deleted_at = Column(DateTime(timezone=True))  # 软删除

    # 关系
    user = relationship("User", back_populates="projects")

    def soft_delete(self):
        """软删除项目"""
        from datetime import datetime
        self.deleted_at = datetime.now()

    def __repr__(self):
        return f"<Project(id={self.id}, type={self.type}, status={self.status})>"

    @property
    def is_completed(self) -> bool:
        """任务是否完成"""
        return self.status == "completed"

    @property
    def is_failed(self) -> bool:
        """任务是否失败"""
        return self.status == "failed"

    @property
    def is_processing(self) -> bool:
        """任务是否处理中"""
        return self.status == "processing"
