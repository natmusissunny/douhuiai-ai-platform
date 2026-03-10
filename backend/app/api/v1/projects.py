"""
Project API Routes
项目相关API
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.project import Project
from app.schemas.project import (
    Text2ImgRequest,
    Img2ImgRequest,
    ImageEditRequest,
    Render3DRequest,
    ProjectResponse,
    ProjectListResponse,
)
from app.services.project import project_service
from app.services.douhuiai import douhuiai_service
from app.tasks.project_tasks import (
    process_text2img_task,
    process_img2img_task,
    process_edit_task,
    process_3d_render_task,
)

router = APIRouter()


@router.post("/text2img", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_text2img(
    request: Text2ImgRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建文生图任务

    - **prompt**: 文字描述 (必填)
    - **negative_prompt**: 负面提示词 (可选)
    - **width**: 图片宽度 (默认512)
    - **height**: 图片高度 (默认512)
    - **steps**: 迭代步数 (默认20)
    - **guidance_scale**: 引导系数 (默认7.5)
    - **num_images**: 生成图片数量 (默认1)
    - **seed**: 随机种子 (可选)
    - **style**: 风格 (可选)
    """
    # 准备参数
    params = request.model_dump()

    # 创建项目记录
    project = await project_service.create_project(
        db=db,
        user=current_user,
        project_type="text2img",
        subtype=request.style,
        input_params=params,
    )

    # 异步调用豆绘AI API
    try:
        # 调用真实的豆绘AI API
        api_response = await douhuiai_service.create_text2img_task(request.prompt, params)
        project.uuid = api_response.get("data", {}).get("uuid")
        db.commit()

        # 添加到后台任务队列
        background_tasks.add_task(process_text2img_task, project.id, params)
    except Exception as e:
        # API调用失败,更新状态并退款
        project_service.update_project_status(
            db, project, "failed", error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to create task: {str(e)}",
        )

    return project


@router.post("/img2img", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_img2img(
    request: Img2ImgRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建图生图任务

    - **image_url**: 输入图片URL (必填)
    - **prompt**: 文字描述 (必填)
    - **negative_prompt**: 负面提示词 (可选)
    - **strength**: 强度 0-1 (默认0.8)
    - **steps**: 迭代步数 (默认20)
    - **guidance_scale**: 引导系数 (默认7.5)
    - **seed**: 随机种子 (可选)
    """
    params = request.model_dump()

    project = await project_service.create_project(
        db=db,
        user=current_user,
        project_type="img2img",
        subtype=None,
        input_params=params,
    )

    try:
        # base64 图片先上传到豆绘 CDN，获得可访问的 URL
        image_url = request.image_url
        if image_url.startswith("data:"):
            import base64
            header, b64data = image_url.split(",", 1)
            file_bytes = base64.b64decode(b64data)
            ext = "jpg" if "jpeg" in header else "png"
            image_url = await douhuiai_service.upload_image(file_bytes, f"upload.{ext}")

        # 调用真实的豆绘AI API
        api_response = await douhuiai_service.create_img2img_task(
            image_url, request.prompt, params
        )
        project.uuid = api_response.get("data", {}).get("uuid")
        db.commit()

        # 添加到后台任务队列
        background_tasks.add_task(process_img2img_task, project.id, params)
    except Exception as e:
        project_service.update_project_status(
            db, project, "failed", error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to create task: {str(e)}",
        )

    return project


@router.post("/edit", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_edit(
    request: ImageEditRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建图片编辑任务

    - **image_url**: 输入图片URL (必填)
    - **edit_type**: 编辑类型 (必填)
      - remove_bg: 去除背景
      - style_transfer: 风格转换
      - upscale: 高清放大
    - **params**: 编辑参数 (可选)
    """
    params = request.model_dump()

    project = await project_service.create_project(
        db=db,
        user=current_user,
        project_type="edit",
        subtype=request.edit_type,
        input_params=params,
    )

    try:
        import base64 as b64mod

        # 主图：base64 → CDN URL
        image_url = request.image_url
        if image_url.startswith("data:"):
            header, b64data = image_url.split(",", 1)
            file_bytes = b64mod.b64decode(b64data)
            ext = "jpg" if "jpeg" in header else "png"
            image_url = await douhuiai_service.upload_image(file_bytes, f"upload.{ext}")

        # 额外参数中的蒙版图（万物替换 dhMaskImg）也可能是 base64
        extra_params = dict(request.params or {})
        if extra_params.get("dhMaskImg", "").startswith("data:"):
            mask_header, mask_b64 = extra_params["dhMaskImg"].split(",", 1)
            mask_bytes = b64mod.b64decode(mask_b64)
            mask_ext = "jpg" if "jpeg" in mask_header else "png"
            extra_params["dhMaskImg"] = await douhuiai_service.upload_image(mask_bytes, f"mask.{mask_ext}")

        # 调用真实的豆绘AI API
        # doEdit 响应格式：{status: 200, uuid: "...", imgs: {...}}（uuid 在顶层）
        api_response = await douhuiai_service.create_edit_task(
            image_url, request.edit_type, extra_params or None
        )
        project.uuid = api_response.get("uuid")
        db.commit()

        # 添加到后台任务队列
        background_tasks.add_task(process_edit_task, project.id, params)
    except Exception as e:
        project_service.update_project_status(
            db, project, "failed", error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to create task: {str(e)}",
        )

    return project


@router.post("/3d_render", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_3d_render(
    request: Render3DRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建3D渲染任务

    - **model_type**: 模型类型 (必填)
    - **prompt**: 描述 (必填)
    - **render_quality**: 渲染质量 (默认medium)
      - low: 低质量
      - medium: 中等质量
      - high: 高质量
    """
    params = request.model_dump()

    project = await project_service.create_project(
        db=db,
        user=current_user,
        project_type="3d_render",
        subtype=request.model_type,
        input_params=params,
    )

    try:
        # 调用真实的豆绘AI API
        api_response = await douhuiai_service.create_3d_render_task(
            request.model_type, request.prompt, params
        )
        project.uuid = api_response.get("data", {}).get("uuid")
        db.commit()

        # 添加到后台任务队列
        background_tasks.add_task(process_3d_render_task, project.id, params)
    except Exception as e:
        project_service.update_project_status(
            db, project, "failed", error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to create task: {str(e)}",
        )

    return project


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    type: Optional[str] = None,
    status: Optional[str] = None,
):
    """
    获取项目列表

    - **skip**: 跳过记录数 (默认0)
    - **limit**: 返回记录数 (默认20, 最大100)
    - **type**: 过滤项目类型 (可选)
    - **status**: 过滤状态 (可选)
    """
    if limit > 100:
        limit = 100

    # 构建查询
    query = db.query(Project).filter(
        Project.user_id == current_user.id, Project.deleted_at == None
    )

    # 过滤条件
    if type:
        query = query.filter(Project.type == type)
    if status:
        query = query.filter(Project.status == status)

    # 总数
    total = query.count()

    # 分页
    projects = query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()

    return {"total": total, "items": projects}


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取项目详情

    - **project_id**: 项目ID
    """
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
            Project.deleted_at == None,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    return project


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    删除项目 (软删除)

    - **project_id**: 项目ID
    """
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
            Project.deleted_at == None,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # 软删除
    project.soft_delete()
    db.commit()

    return {"message": "Project deleted successfully"}


@router.post("/{project_id}/retry", response_model=ProjectResponse)
async def retry_project(
    project_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    重试失败任务

    - **project_id**: 项目ID

    注意: 重试会创建新的配额消耗记录
    """
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
            Project.deleted_at == None,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # 只能重试失败的任务
    if project.status != "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only failed projects can be retried",
        )

    # 检查配额
    if not project_service.check_quota(current_user, project.quota_cost):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient quota. Required: {project.quota_cost}",
        )

    # 消耗配额
    project_service.consume_quota(
        db, current_user, project.quota_cost, project.id, f"{project.type}任务重试"
    )

    # 重置状态
    project.status = "pending"
    project.progress = 0
    project.error_message = None

    # 提交任务到队列
    # background_tasks.add_task(process_project_task, project.id)

    db.commit()
    db.refresh(project)

    return project
