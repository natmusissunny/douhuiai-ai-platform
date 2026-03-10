"""
Admin API Routes
管理后台API
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from datetime import datetime, timedelta
from decimal import Decimal

from app.database import get_db
from app.dependencies import require_permission
from app.models.user import User
from app.models.role import Role
from app.models.project import Project
from app.models.quota_transaction import QuotaTransaction
from app.schemas.admin import (
    UserListResponse,
    UserDetailResponse,
    UserStatusUpdate,
    UserQuotaUpdate,
    UserCreate,
    UserUpdate,
    UserQuotaAdjust,
    TransactionListResponse,
    ApiBalanceResponse,
    RoleListItem,
    RoleCreate,
    RoleUpdate,
    SystemStats,
    ProjectStats,
    QuotaStats,
)
from app.config import settings
import httpx

router = APIRouter()


# ==================== 用户管理 ====================

@router.get("/users", response_model=UserListResponse)
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage")),
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    role_id: Optional[int] = None,
    search: Optional[str] = None,
):
    """
    获取用户列表 (需要 user.manage 权限)

    - **skip**: 跳过记录数
    - **limit**: 返回记录数 (最多100)
    - **status**: 过滤状态 (active/disabled/banned)
    - **role_id**: 过滤角色
    - **search**: 搜索用户名或邮箱
    """
    if limit > 100:
        limit = 100

    # 构建查询
    query = db.query(User).filter(User.deleted_at == None)

    # 过滤条件
    if status:
        query = query.filter(User.status == status)
    if role_id:
        query = query.filter(User.role_id == role_id)
    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )

    # 总数
    total = query.count()

    # 分页
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    return {"total": total, "items": users}


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage")),
):
    """
    获取用户详情 (需要 user.manage 权限)
    """
    user = db.query(User).filter(User.id == user_id, User.deleted_at == None).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # 统计项目数量
    project_count = (
        db.query(Project)
        .filter(Project.user_id == user_id, Project.deleted_at == None)
        .count()
    )

    # 统计总配额消耗
    total_consumed = (
        db.query(func.sum(QuotaTransaction.amount))
        .filter(
            QuotaTransaction.user_id == user_id,
            QuotaTransaction.type == "consume",
        )
        .scalar()
        or Decimal("0")
    )

    # 构建响应
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "quota_balance": user.quota_balance,
        "role": {"id": user.role.id, "name": user.role.name} if user.role else None,
        "status": user.status,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "last_login_at": user.last_login_at,
        "project_count": project_count,
        "total_quota_used": abs(total_consumed),
    }

    return user_dict


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage")),
):
    """
    更新用户状态 (需要 user.manage 权限)

    - **status**: active/disabled/banned
    """
    user = db.query(User).filter(User.id == user_id, User.deleted_at == None).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # 不能修改自己的状态
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own status",
        )

    # 验证状态
    if status_update.status not in ["active", "disabled", "banned"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status"
        )

    user.status = status_update.status
    db.commit()

    return {"message": "User status updated successfully"}


@router.post("/users/{user_id}/quota")
async def update_user_quota(
    user_id: int,
    quota_update: UserQuotaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage")),
):
    """
    充值用户配额 (需要 user.manage 权限)

    - **amount**: 充值金额 (正数为充值, 负数为扣除)
    - **description**: 描述
    """
    user = db.query(User).filter(User.id == user_id, User.deleted_at == None).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # 更新配额
    user.quota_balance += quota_update.amount

    # 创建交易记录
    transaction = QuotaTransaction(
        user_id=user.id,
        type="recharge" if quota_update.amount > 0 else "consume",
        amount=quota_update.amount,
        balance_after=user.quota_balance,
        description=quota_update.description,
    )
    db.add(transaction)
    db.commit()

    return {
        "message": "Quota updated successfully",
        "new_balance": user.quota_balance,
    }


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage")),
):
    """
    管理员创建用户 (需要 user.manage 权限)

    - 超管可以创建任意角色的用户（包括管理员）
    - 普通管理员只能创建普通用户/VIP
    """
    # 普通管理员不能创建管理员级别账户（role_id 1=超管, 2=管理员）
    if not current_user.role.has_permission("*") and user_data.role_id in (1, 2):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="普通管理员无法创建管理员账户",
        )

    # 检查用户名/邮箱是否重复
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="用户名已存在")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    # 检查角色是否存在
    role = db.query(Role).filter(Role.id == user_data.role_id, Role.deleted_at == None).first()
    if not role:
        raise HTTPException(status_code=400, detail="角色不存在")

    from app.utils.security import get_password_hash
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        phone=user_data.phone,
        nickname=user_data.nickname,
        role_id=user_data.role_id,
        quota_balance=user_data.quota_balance,
        quota_limit=user_data.quota_limit,
        monthly_quota=user_data.monthly_quota,
        status=user_data.status,
        is_verified=True,
    )
    db.add(user)
    db.flush()  # 获取 user.id

    # 如果初始配额 > 0，记录交易
    if user_data.quota_balance > 0:
        txn = QuotaTransaction(
            user_id=user.id,
            type="recharge",
            amount=user_data.quota_balance,
            balance_after=user_data.quota_balance,
            description="管理员创建用户时初始化配额",
            operator_id=current_user.id,
        )
        db.add(txn)

    db.commit()
    db.refresh(user)
    return {"message": "用户创建成功", "user_id": user.id}


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage")),
):
    """
    管理员编辑用户信息 (需要 user.manage 权限)
    """
    user = db.query(User).filter(User.id == user_id, User.deleted_at == None).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 普通管理员不能修改管理员账户
    if not current_user.role.has_permission("*") and user.role_id in (1, 2):
        raise HTTPException(status_code=403, detail="无权修改管理员账户")

    # 邮箱唯一性检查
    if user_data.email and user_data.email != user.email:
        if db.query(User).filter(User.email == user_data.email, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="邮箱已被其他用户使用")

    # 修改角色时的权限检查
    if user_data.role_id and not current_user.role.has_permission("*") and user_data.role_id in (1, 2):
        raise HTTPException(status_code=403, detail="普通管理员无法设置管理员角色")

    # 应用更新
    update_fields = user_data.model_dump(exclude_none=True)
    for field, value in update_fields.items():
        setattr(user, field, value)

    db.commit()
    return {"message": "用户信息更新成功"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage")),
):
    """
    管理员删除用户（软删除，需要 user.manage 权限）

    - 只有超管才能删除管理员账户
    - 不能删除自己
    """
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="不能删除自己的账户")

    user = db.query(User).filter(User.id == user_id, User.deleted_at == None).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if not current_user.role.has_permission("*") and user.role_id in (1, 2):
        raise HTTPException(status_code=403, detail="只有超管才能删除管理员账户")

    from datetime import datetime as dt
    user.deleted_at = dt.utcnow()
    db.commit()
    return {"message": "用户已删除"}


@router.post("/users/{user_id}/quota/adjust")
async def adjust_user_quota(
    user_id: int,
    quota: UserQuotaAdjust,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage")),
):
    """
    调整用户豆点额度（需要 user.manage 权限）

    - **op**: set=直接设为某值, add=增加, subtract=扣除
    - **amount**: 操作金额（均为正数）
    - **remark**: 操作备注（必填）
    """
    user = db.query(User).filter(User.id == user_id, User.deleted_at == None).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    old_balance = user.quota_balance

    if quota.op == "set":
        if quota.amount < 0:
            raise HTTPException(status_code=400, detail="设置的余额不能为负数")
        user.quota_balance = quota.amount
    elif quota.op == "add":
        user.quota_balance += quota.amount
    elif quota.op == "subtract":
        if user.quota_balance - quota.amount < 0:
            raise HTTPException(status_code=400, detail="扣除后余额不能为负数")
        user.quota_balance -= quota.amount

    change = user.quota_balance - old_balance
    txn_type = "recharge" if change >= 0 else "consume"

    txn = QuotaTransaction(
        user_id=user.id,
        type=txn_type,
        amount=change,
        balance_after=user.quota_balance,
        remark=quota.remark,
        description=f"管理员{dict(set='直接设置',add='增加',subtract='扣除')[quota.op]}豆点",
        related_type="admin_operation",
        operator_id=current_user.id,
    )
    db.add(txn)
    db.commit()

    return {
        "message": "配额调整成功",
        "old_balance": float(old_balance),
        "new_balance": float(user.quota_balance),
        "change": float(change),
    }


# ==================== 流水记录 ====================

@router.get("/quota-transactions", response_model=TransactionListResponse)
async def list_quota_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("stats.view")),
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[int] = None,
    type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """
    获取配额流水记录 (需要 stats.view 权限)

    - **user_id**: 过滤指定用户
    - **type**: recharge/consume/refund
    - **start_date**: 开始日期 YYYY-MM-DD
    - **end_date**: 结束日期 YYYY-MM-DD
    """
    if limit > 200:
        limit = 200

    query = db.query(QuotaTransaction)
    if user_id:
        query = query.filter(QuotaTransaction.user_id == user_id)
    if type:
        query = query.filter(QuotaTransaction.type == type)
    if start_date:
        query = query.filter(QuotaTransaction.created_at >= start_date)
    if end_date:
        query = query.filter(QuotaTransaction.created_at <= f"{end_date} 23:59:59")

    total = query.count()
    transactions = query.order_by(QuotaTransaction.created_at.desc()).offset(skip).limit(limit).all()

    # 组装返回数据
    items = []
    # 批量查用户名（避免 N+1）
    user_ids = list({t.user_id for t in transactions} | {t.operator_id for t in transactions if t.operator_id})
    user_map = {u.id: u.username for u in db.query(User.id, User.username).filter(User.id.in_(user_ids)).all()}

    for t in transactions:
        items.append({
            "id": t.id,
            "user_id": t.user_id,
            "username": user_map.get(t.user_id, ""),
            "type": t.type,
            "amount": t.amount,
            "balance_after": t.balance_after,
            "remark": t.remark,
            "description": t.description,
            "operator_id": t.operator_id,
            "operator_username": user_map.get(t.operator_id) if t.operator_id else None,
            "related_type": t.related_type,
            "related_id": t.related_id,
            "created_at": t.created_at,
        })

    return {"total": total, "items": items}


# ==================== 豆绘 API 余额监控 ====================

@router.get("/api-balance", response_model=ApiBalanceResponse)
async def get_api_balance(
    current_user: User = Depends(require_permission("stats.view")),
):
    """
    查询豆绘 API 账户余额（实时请求豆绘服务器）
    """
    # 发送一个最小的探测请求，通过余额不足的错误信息获取当前余额数值
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.DOUHUIAI_API_URL}/api/aiart/doGenKontext",
                headers={
                    "Authorization": f"Bearer {settings.DOUHUIAI_APP_SECRET}",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                },
                data={
                    "dhAiType": "kontextimg",
                    "dhMode": "text",
                    "dhPrompt": "balance_check",
                    "dhImgNum": "1",
                    "dhImgSize": "-1",
                    "dhImgRatio": "1:1",
                },
            )
        result = response.json()
        msg = result.get("msg", "")

        # 解析余额不足消息中的当前余额数值
        # 格式：总账户余额不足，当前余额0，需扣费20
        import re
        match = re.search(r"当前余额(\d+\.?\d*)", msg)
        balance = float(match.group(1)) if match else 0.0

        # 如果成功（说明账户有余额且任务已创建），余额来自 data
        if result.get("code") == "200":
            balance = float("inf")  # 成功表示余额充足，无法精确读取

    except Exception:
        balance = -1.0  # 请求失败

    WARNING_THRESHOLD = 100.0
    return {
        "balance": balance,
        "app_id": settings.DOUHUIAI_APP_ID,
        "warning": balance >= 0 and balance < WARNING_THRESHOLD,
        "warning_threshold": WARNING_THRESHOLD,
    }


# ==================== 角色管理 ====================

@router.get("/roles", response_model=list[RoleListItem])
async def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("role.manage")),
):
    """
    获取角色列表 (需要 role.manage 权限)
    """
    roles = db.query(Role).filter(Role.deleted_at == None).all()

    # 统计每个角色的用户数
    result = []
    for role in roles:
        user_count = db.query(User).filter(User.role_id == role.id).count()
        result.append(
            {
                "id": role.id,
                "name": role.name,
                "description": role.description,
                "permissions": role.permissions,
                "user_count": user_count,
                "created_at": role.created_at,
            }
        )

    return result


@router.post("/roles", status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("role.manage")),
):
    """
    创建角色 (需要 role.manage 权限)
    """
    # 检查角色名是否已存在
    existing = db.query(Role).filter(Role.name == role_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name already exists",
        )

    role = Role(
        name=role_data.name,
        description=role_data.description,
        permissions=role_data.permissions,
    )
    db.add(role)
    db.commit()
    db.refresh(role)

    return {"message": "Role created successfully", "role_id": role.id}


@router.put("/roles/{role_id}")
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("role.manage")),
):
    """
    更新角色 (需要 role.manage 权限)
    """
    role = db.query(Role).filter(Role.id == role_id, Role.deleted_at == None).first()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    # 更新字段
    if role_data.name is not None:
        # 检查名称是否冲突
        existing = (
            db.query(Role)
            .filter(Role.name == role_data.name, Role.id != role_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists",
            )
        role.name = role_data.name

    if role_data.description is not None:
        role.description = role_data.description

    if role_data.permissions is not None:
        role.permissions = role_data.permissions

    db.commit()

    return {"message": "Role updated successfully"}


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("role.manage")),
):
    """
    删除角色 (需要 role.manage 权限)
    """
    role = db.query(Role).filter(Role.id == role_id, Role.deleted_at == None).first()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    # 检查是否有用户使用该角色
    user_count = db.query(User).filter(User.role_id == role_id).count()
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete role with {user_count} users",
        )

    # 软删除
    role.soft_delete()
    db.commit()

    return {"message": "Role deleted successfully"}


# ==================== 统计数据 ====================

@router.get("/statistics/system", response_model=SystemStats)
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("stats.view")),
):
    """
    获取系统统计 (需要 stats.view 权限)
    """
    today = datetime.utcnow().date()
    month_start = today.replace(day=1)

    # 用户统计
    total_users = db.query(User).filter(User.deleted_at == None).count()
    active_users = (
        db.query(User).filter(User.status == "active", User.deleted_at == None).count()
    )

    # 项目统计
    total_projects = db.query(Project).filter(Project.deleted_at == None).count()
    projects_today = (
        db.query(Project)
        .filter(
            Project.deleted_at == None,
            func.date(Project.created_at) == today,
        )
        .count()
    )
    projects_this_month = (
        db.query(Project)
        .filter(
            Project.deleted_at == None,
            func.date(Project.created_at) >= month_start,
        )
        .count()
    )

    # 配额统计
    total_consumed = (
        db.query(func.sum(QuotaTransaction.amount))
        .filter(QuotaTransaction.type == "consume")
        .scalar()
        or Decimal("0")
    )
    consumed_today = (
        db.query(func.sum(QuotaTransaction.amount))
        .filter(
            QuotaTransaction.type == "consume",
            func.date(QuotaTransaction.created_at) == today,
        )
        .scalar()
        or Decimal("0")
    )
    consumed_this_month = (
        db.query(func.sum(QuotaTransaction.amount))
        .filter(
            QuotaTransaction.type == "consume",
            func.date(QuotaTransaction.created_at) >= month_start,
        )
        .scalar()
        or Decimal("0")
    )

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_projects": total_projects,
        "projects_today": projects_today,
        "projects_this_month": projects_this_month,
        "total_quota_consumed": abs(total_consumed),
        "quota_consumed_today": abs(consumed_today),
        "quota_consumed_this_month": abs(consumed_this_month),
    }


@router.get("/statistics/projects", response_model=ProjectStats)
async def get_project_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("stats.view")),
):
    """
    获取项目统计 (需要 stats.view 权限)
    """
    # 按类型统计
    by_type = {}
    type_stats = (
        db.query(Project.type, func.count(Project.id))
        .filter(Project.deleted_at == None)
        .group_by(Project.type)
        .all()
    )
    for type_name, count in type_stats:
        by_type[type_name] = count

    # 按状态统计
    by_status = {}
    status_stats = (
        db.query(Project.status, func.count(Project.id))
        .filter(Project.deleted_at == None)
        .group_by(Project.status)
        .all()
    )
    for status_name, count in status_stats:
        by_status[status_name] = count

    # 成功率
    total = sum(by_status.values())
    completed = by_status.get("completed", 0)
    success_rate = (completed / total * 100) if total > 0 else 0

    # 平均处理时间 (简化计算)
    avg_time = 0.0
    completed_projects = (
        db.query(Project)
        .filter(
            Project.status == "completed",
            Project.completed_at.isnot(None),
            Project.deleted_at == None,
        )
        .limit(100)
        .all()
    )
    if completed_projects:
        times = [
            (p.completed_at - p.created_at).total_seconds()
            for p in completed_projects
        ]
        avg_time = sum(times) / len(times)

    return {
        "by_type": by_type,
        "by_status": by_status,
        "success_rate": round(success_rate, 2),
        "avg_processing_time": round(avg_time, 2),
    }


@router.get("/statistics/quota", response_model=QuotaStats)
async def get_quota_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("stats.view")),
):
    """
    获取配额统计 (需要 stats.view 权限)
    """
    today = datetime.utcnow().date()
    month_start = today.replace(day=1)

    # 总充值
    total_recharged = (
        db.query(func.sum(QuotaTransaction.amount))
        .filter(QuotaTransaction.type == "recharge")
        .scalar()
        or Decimal("0")
    )

    # 总消耗
    total_consumed = (
        db.query(func.sum(QuotaTransaction.amount))
        .filter(QuotaTransaction.type == "consume")
        .scalar()
        or Decimal("0")
    )

    # 总退款
    total_refunded = (
        db.query(func.sum(QuotaTransaction.amount))
        .filter(QuotaTransaction.type == "refund")
        .scalar()
        or Decimal("0")
    )

    # 当前余额
    balance = (
        db.query(func.sum(User.quota_balance))
        .filter(User.deleted_at == None)
        .scalar()
        or Decimal("0")
    )

    # 今日交易
    transactions_today = (
        db.query(QuotaTransaction)
        .filter(func.date(QuotaTransaction.created_at) == today)
        .count()
    )

    # 本月交易
    transactions_this_month = (
        db.query(QuotaTransaction)
        .filter(func.date(QuotaTransaction.created_at) >= month_start)
        .count()
    )

    return {
        "total_recharged": total_recharged,
        "total_consumed": abs(total_consumed),
        "total_refunded": total_refunded,
        "balance": balance,
        "transactions_today": transactions_today,
        "transactions_this_month": transactions_this_month,
    }
