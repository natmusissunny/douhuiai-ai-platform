"""
Project Service
项目服务层 - 处理项目创建、配额计算等业务逻辑
"""

import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from decimal import Decimal

from app.models.project import Project
from app.models.user import User
from app.models.quota_transaction import QuotaTransaction
from app.schemas.project import ProjectCreate


def calculate_quota_cost(
    project_type: str,
    subtype: Optional[str],
    params: Dict[str, Any]
) -> Decimal:
    """
    计算项目配额消耗

    Args:
        project_type: 项目类型
        subtype: 子类型
        params: 输入参数

    Returns:
        Decimal: 配额消耗点数
    """
    base_cost = Decimal("1.0")

    if project_type == "text2img":
        # 基础成本 1.0
        # 根据图片尺寸调整
        width = params.get("width", 512)
        height = params.get("height", 512)
        if width > 1024 or height > 1024:
            base_cost *= Decimal("2.0")

        # 根据数量调整
        num_images = params.get("num_images", 1)
        base_cost *= Decimal(str(num_images))

    elif project_type == "img2img":
        # 图生图基础成本 1.5
        base_cost = Decimal("1.5")
        num_images = params.get("num_images", 1)
        base_cost *= Decimal(str(num_images))

    elif project_type == "edit":
        # 编辑类任务成本 2.0
        base_cost = Decimal("2.0")
        if subtype == "upscale":
            # 放大任务额外成本
            base_cost *= Decimal("1.5")

    elif project_type == "3d_render":
        # 3D渲染成本较高 5.0
        base_cost = Decimal("5.0")

    elif project_type == "architecture":
        # 建筑室内基础成本 2.0，3D渲染/概念图稍高
        base_cost = Decimal("2.0")
        if subtype in ("concept", "arch_3d", "rough_to_fine"):
            base_cost = Decimal("3.0")

    elif project_type == "video":
        # 视频成本较高
        base_cost = Decimal("5.0")
        if subtype == "text2voice":
            base_cost = Decimal("1.0")  # 文生音频成本低
        elif subtype in ("sora2video", "presenter"):
            base_cost = Decimal("8.0")  # 高级视频成本更高

    elif project_type == "ecommerce":
        # 产品电商基础成本 2.0，一键生成类稍高
        base_cost = Decimal("2.0")
        if subtype in ("scene_bg", "selling_point", "virtual_tryon", "product_design"):
            base_cost = Decimal("3.0")

    elif project_type == "portrait":
        # 人像写真基础成本 2.0，AI写真/换脸稍高
        base_cost = Decimal("2.0")
        if subtype in ("ai_portrait", "face_swap"):
            base_cost = Decimal("3.0")

    return base_cost


async def create_project(
    db: Session,
    user: User,
    project_type: str,
    subtype: Optional[str],
    input_params: Dict[str, Any],
    prompt: Optional[str] = None
) -> Project:
    """
    创建项目/任务

    Args:
        db: 数据库会话
        user: 用户对象
        project_type: 项目类型
        subtype: 子类型
        input_params: 输入参数
        prompt: 提示词

    Returns:
        Project: 创建的项目对象

    Raises:
        ValueError: 配额不足时抛出
    """
    # 计算配额消耗
    quota_cost = calculate_quota_cost(project_type, subtype, input_params)

    # 检查用户配额
    if user.quota_balance < quota_cost:
        raise ValueError(f"Insufficient quota. Required: {quota_cost}, Available: {user.quota_balance}")

    # 创建项目
    project = Project(
        uuid=str(uuid.uuid4()),
        user_id=user.id,
        type=project_type,
        subtype=subtype,
        input_params=input_params,
        status="pending",
        quota_cost=quota_cost,
    )

    db.add(project)

    # 扣除配额
    user.quota_balance -= quota_cost

    # 记录配额交易
    transaction = QuotaTransaction(
        user_id=user.id,
        amount=-quota_cost,
        balance_after=user.quota_balance,
        type="consume",
        description=f"创建{project_type}任务",
        related_type="project",
        related_id=None,  # 会在flush后更新
    )
    db.add(transaction)

    # 提交以获取project.id
    db.flush()

    # 更新transaction的关联项目ID
    transaction.related_id = project.id

    db.commit()
    db.refresh(project)

    return project


def get_user_projects(
    db: Session,
    user_id: int,
    project_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """
    获取用户的项目列表

    Args:
        db: 数据库会话
        user_id: 用户ID
        project_type: 项目类型过滤(可选)
        status: 状态过滤(可选)
        skip: 跳过数量
        limit: 返回数量限制

    Returns:
        tuple: (项目列表, 总数)
    """
    query = db.query(Project).filter(
        Project.user_id == user_id,
        Project.deleted_at == None
    )

    if project_type:
        query = query.filter(Project.type == project_type)

    if status:
        query = query.filter(Project.status == status)

    total = query.count()
    projects = query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()

    return projects, total


def get_project_by_id(db: Session, project_id: int, user_id: int) -> Optional[Project]:
    """获取指定项目"""
    return db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == user_id,
        Project.deleted_at == None
    ).first()


def delete_project(db: Session, project: Project):
    """软删除项目"""
    from datetime import datetime
    project.deleted_at = datetime.now()
    db.commit()


# 创建服务实例
class ProjectService:
    """项目服务类(单例模式)"""

    def calculate_quota_cost(
        self,
        project_type: str,
        subtype: Optional[str],
        params: Dict[str, Any]
    ) -> Decimal:
        """计算项目配额消耗(包装全局函数)"""
        return calculate_quota_cost(project_type, subtype, params)

    async def create_project(
        self,
        db: Session,
        user: User,
        project_type: str,
        subtype: Optional[str],
        input_params: Dict[str, Any],
        prompt: Optional[str] = None
    ) -> Project:
        """创建项目/任务(包装全局函数)"""
        return await create_project(db, user, project_type, subtype, input_params, prompt)

    def update_project_status(
        self,
        db: Session,
        project: Project,
        status: str,
        progress: Optional[int] = None,
        result_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ) -> Project:
        """
        更新项目状态

        Args:
            db: 数据库会话
            project: 项目对象
            status: 新状态 (pending/processing/completed/failed)
            progress: 进度百分比 (0-100)
            result_data: 结果数据
            error_message: 错误信息

        Returns:
            Project: 更新后的项目对象
        """
        project.status = status

        if progress is not None:
            project.progress = progress

        if result_data is not None:
            project.result = result_data

        if error_message is not None:
            project.error_message = error_message

        if status == "completed":
            from datetime import datetime
            project.completed_at = datetime.now()
            project.progress = 100

        db.commit()
        db.refresh(project)
        return project

    def check_quota(self, user: User, quota_cost: Decimal) -> bool:
        """
        检查用户配额是否充足

        Args:
            user: 用户对象
            quota_cost: 需要的配额

        Returns:
            bool: 配额是否充足
        """
        return user.quota_balance >= quota_cost

    def consume_quota(
        self,
        db: Session,
        user: User,
        cost: Decimal,
        project_id: Optional[int] = None,
        description: str = "消费配额"
    ) -> QuotaTransaction:
        """
        消费用户配额

        Args:
            db: 数据库会话
            user: 用户对象
            cost: 消费金额
            project_id: 关联的项目ID
            description: 交易描述

        Returns:
            QuotaTransaction: 配额交易记录

        Raises:
            ValueError: 配额不足时抛出
        """
        if user.quota_balance < cost:
            raise ValueError(f"配额不足. 需要: {cost}, 可用: {user.quota_balance}")

        # 扣除配额
        user.quota_balance -= cost

        # 记录交易
        transaction = QuotaTransaction(
            user_id=user.id,
            amount=-cost,
            balance_after=user.quota_balance,
            type="consume",
            description=description,
            related_type="project",
            related_id=project_id,
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        return transaction

    def get_user_projects(
        self,
        db: Session,
        user_id: int,
        project_type: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ):
        """获取用户的项目列表(包装全局函数)"""
        return get_user_projects(db, user_id, project_type, status, skip, limit)

    def get_project_by_id(self, db: Session, project_id: int, user_id: int) -> Optional[Project]:
        """获取指定项目(包装全局函数)"""
        return get_project_by_id(db, project_id, user_id)

    def delete_project(self, db: Session, project: Project):
        """软删除项目(包装全局函数)"""
        return delete_project(db, project)


project_service = ProjectService()
