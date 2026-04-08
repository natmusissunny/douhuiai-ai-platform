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
    PortraitRequest,
    EcommerceRequest,
    VideoRequest,
    ArchitectureRequest,
    RepaintRequest,
    ModelCreateRequest,
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
    process_portrait_task,
    process_ecommerce_task,
    process_video_task,
    process_architecture_task,
    process_repaint_task,
    process_model_create_task,
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


@router.post("/repaint", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_repaint(
    request: RepaintRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建图片重绘任务

    - **image_url**: 输入图片URL (必填)
    - **prompt**: 描述 (必填)
    - **mode**: 重绘模式 standard/smart (默认standard)
    - **params**: 额外参数 (dhDenoise/dhModel/dhLoraIds等)
    """
    params = request.model_dump()
    project = await project_service.create_project(
        db=db, user=current_user, project_type="img2img",
        subtype=f"repaint_{request.mode}", input_params=params,
    )
    try:
        import base64 as b64mod
        image_url = request.image_url
        if image_url.startswith("data:"):
            header, b64data = image_url.split(",", 1)
            file_bytes = b64mod.b64decode(b64data)
            ext = "jpg" if "jpeg" in header else "png"
            image_url = await douhuiai_service.upload_image(file_bytes, f"repaint.{ext}")

        api_response = await douhuiai_service.create_repaint_task(
            image_url, request.prompt, request.mode, request.params
        )
        project.uuid = api_response.get("uuid")

        result_urls = douhuiai_service.parse_edit_result_urls(api_response)
        if result_urls:
            project_service.update_project_status(
                db, project, "completed", progress=100,
                result_data={"result_urls": result_urls},
            )
        else:
            db.commit()
            background_tasks.add_task(process_repaint_task, project.id, params)
    except Exception as e:
        project_service.update_project_status(db, project, "failed", error_message=str(e))
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Failed to create task: {str(e)}")
    return project


@router.post("/model_create", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_model(
    request: ModelCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建大模型创作任务（Flux/SDXL/N-banana等）

    - **model**: 模型类型 flux/sdxl/nanoimg/midjourney/kontext (必填)
    - **prompt**: 描述 (必填)
    - **image_url**: 参考图URL (可选)
    - **params**: 额外参数 (dhLoraIds/dhPaintStyle/dhImgNum等)
    """
    params = request.model_dump()
    project = await project_service.create_project(
        db=db, user=current_user, project_type="text2img",
        subtype=request.model, input_params=params,
    )
    try:
        import base64 as b64mod
        image_url = request.image_url
        if image_url and image_url.startswith("data:"):
            header, b64data = image_url.split(",", 1)
            file_bytes = b64mod.b64decode(b64data)
            ext = "jpg" if "jpeg" in header else "png"
            image_url = await douhuiai_service.upload_image(file_bytes, f"model_ref.{ext}")

        api_response = await douhuiai_service.create_model_task(
            request.model, request.prompt, image_url, request.params
        )
        project.uuid = api_response.get("uuid") or api_response.get("data", {}).get("uuid")

        result_urls = douhuiai_service.parse_edit_result_urls(api_response)
        if not result_urls:
            result_urls = douhuiai_service.parse_result_urls(api_response)
        if result_urls:
            project_service.update_project_status(
                db, project, "completed", progress=100,
                result_data={"result_urls": result_urls},
            )
        else:
            db.commit()
            background_tasks.add_task(process_model_create_task, project.id, params)
    except Exception as e:
        project_service.update_project_status(db, project, "failed", error_message=str(e))
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Failed to create task: {str(e)}")
    return project


@router.post("/architecture", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_architecture(
    request: ArchitectureRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建建筑室内任务

    - **arch_type**: 功能类型 (必填)
      - 专用端点: concept/arch_3d/line_render/color_cad/rough_to_fine
      - 场景加模特: add_model_smart/add_model_paint/add_model_repair
      - 软硬装替换: furnish_smart/furnish_paint
      - 效果图后期: arch_upscale/arch_wash/arch_clear/arch_daynight 等
    - **image_url**: 输入图片URL (大部分功能需要)
    - **prompt**: 描述/指令 (可选)
    - **params**: 额外参数 (dhLoraIds/dhPaintStyle/dhMaskImg等)
    """
    params = request.model_dump()

    project = await project_service.create_project(
        db=db,
        user=current_user,
        project_type="architecture",
        subtype=request.arch_type,
        input_params=params,
    )

    try:
        import base64 as b64mod

        image_url = request.image_url
        if image_url and image_url.startswith("data:"):
            header, b64data = image_url.split(",", 1)
            file_bytes = b64mod.b64decode(b64data)
            ext = "jpg" if "jpeg" in header else "png"
            image_url = await douhuiai_service.upload_image(file_bytes, f"arch.{ext}")

        api_response = await douhuiai_service.create_architecture_task(
            request.arch_type, image_url, request.prompt, request.params
        )
        project.uuid = api_response.get("uuid")

        result_urls = douhuiai_service.parse_edit_result_urls(api_response)
        if result_urls:
            project_service.update_project_status(
                db, project, "completed", progress=100,
                result_data={"result_urls": result_urls},
            )
        else:
            db.commit()
            background_tasks.add_task(process_architecture_task, project.id, params)

    except Exception as e:
        project_service.update_project_status(
            db, project, "failed", error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to create task: {str(e)}",
        )

    return project


@router.post("/video", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_video(
    request: VideoRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建视频/音频任务

    - **video_type**: 功能类型 (必填)
      - text2video: 文生视频
      - image2video: 图生视频
      - frames2video: 首尾帧
      - sora2video: Sora2视频
      - presenter: 数字人口播
      - text2videoaudio: 文生视频(音频版)
      - image2videoaudio: 图生视频(音频版)
      - text2voice: 文生音频
    - **prompt**: 描述 (必填)
    - **image_url**: 输入图片URL (图生视频等需要)
    - **params**: 额外参数 (dhDuration/dhMode/dhResolution/dhVoiceId等)
    """
    params = request.model_dump()

    project = await project_service.create_project(
        db=db,
        user=current_user,
        project_type="video",
        subtype=request.video_type,
        input_params=params,
    )

    try:
        import base64 as b64mod

        image_url = request.image_url
        if image_url and image_url.startswith("data:"):
            header, b64data = image_url.split(",", 1)
            file_bytes = b64mod.b64decode(b64data)
            ext = "jpg" if "jpeg" in header else "png"
            image_url = await douhuiai_service.upload_image(file_bytes, f"video_input.{ext}")

        # 文生音频走单独接口
        if request.video_type == "text2voice":
            extra = request.params or {}
            api_response = await douhuiai_service.create_audio_task(
                request.prompt, str(extra.get("dhVoiceId", "")),
                extra.get("dhEmotion")
            )
        else:
            api_response = await douhuiai_service.create_video_task(
                request.video_type, request.prompt, image_url, request.params
            )

        project.uuid = api_response.get("uuid")

        result_urls = douhuiai_service.parse_edit_result_urls(api_response)
        if result_urls:
            project_service.update_project_status(
                db, project, "completed", progress=100,
                result_data={"result_urls": result_urls},
            )
        else:
            db.commit()
            background_tasks.add_task(process_video_task, project.id, params)

    except Exception as e:
        project_service.update_project_status(
            db, project, "failed", error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to create task: {str(e)}",
        )

    return project


@router.post("/ecommerce", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_ecommerce(
    request: EcommerceRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建产品电商任务

    - **image_url**: 产品图URL (必填)
    - **ecommerce_type**: 功能类型 (必填)
      - 一键生成: white_bg/scene_bg/selling_point/detail_enhance/virtual_tryon
      - 商品图编辑: product_rmbg/product_clear/product_refine/product_upscale 等
      - AI设计: product_design
    - **prompt**: 自定义描述 (可选)
    - **params**: 额外参数 (可选，如dhDesignMode/dhImgNum等)
    """
    params = request.model_dump()

    project = await project_service.create_project(
        db=db,
        user=current_user,
        project_type="ecommerce",
        subtype=request.ecommerce_type,
        input_params=params,
    )

    try:
        import base64 as b64mod

        image_url = request.image_url
        if image_url.startswith("data:"):
            header, b64data = image_url.split(",", 1)
            file_bytes = b64mod.b64decode(b64data)
            ext = "jpg" if "jpeg" in header else "png"
            image_url = await douhuiai_service.upload_image(file_bytes, f"product.{ext}")

        api_response = await douhuiai_service.create_ecommerce_task(
            request.ecommerce_type, image_url, request.prompt, request.params
        )
        project.uuid = api_response.get("uuid")

        result_urls = douhuiai_service.parse_edit_result_urls(api_response)
        if result_urls:
            project_service.update_project_status(
                db, project, "completed", progress=100,
                result_data={"result_urls": result_urls},
            )
        else:
            db.commit()
            background_tasks.add_task(process_ecommerce_task, project.id, params)

    except Exception as e:
        project_service.update_project_status(
            db, project, "failed", error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to create task: {str(e)}",
        )

    return project


@router.post("/portrait", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_portrait(
    request: PortraitRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建人像写真任务

    - **image_url**: 主图URL (必填)
    - **portrait_type**: 功能类型 (必填)
      - face_swap: 人像换脸（需要face_url）
      - old_photo_repair: 老照片修复
      - portrait_hd: 人像变清晰
      - colorize: 照片上色
      - id_photo: AI证件照（需要face_url）
      - ai_portrait: AI写真（需要face_url）
      - hair_change: AI换发型
      - people2cartoon: 真人转漫画
    - **face_url**: 人脸参考图URL（换脸/证件照/写真需要）
    - **params**: 额外参数（如老照片修复的blurLevel）
    """
    params = request.model_dump()

    project = await project_service.create_project(
        db=db,
        user=current_user,
        project_type="portrait",
        subtype=request.portrait_type,
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
            image_url = await douhuiai_service.upload_image(file_bytes, f"portrait.{ext}")

        # 人脸图：base64 → CDN URL
        face_url = request.face_url
        if face_url and face_url.startswith("data:"):
            header, b64data = face_url.split(",", 1)
            file_bytes = b64mod.b64decode(b64data)
            ext = "jpg" if "jpeg" in header else "png"
            face_url = await douhuiai_service.upload_image(file_bytes, f"face.{ext}")

        # 调用豆绘AI人像写真API
        api_response = await douhuiai_service.create_portrait_task(
            request.portrait_type, image_url, face_url, request.params
        )
        project.uuid = api_response.get("uuid")

        # 专用端点可能直接返回结果
        result_urls = douhuiai_service.parse_edit_result_urls(api_response)
        if result_urls:
            project_service.update_project_status(
                db, project, "completed", progress=100,
                result_data={"result_urls": result_urls},
            )
        else:
            db.commit()
            # 需要轮询的任务加入后台队列
            background_tasks.add_task(process_portrait_task, project.id, params)

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
