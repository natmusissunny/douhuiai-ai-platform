"""
项目相关的 Celery 任务

豆绘AI任务状态码：
    200  = 完成（imglist 中有图片文件名）
    -200 = 进行中
    500  = 失败
    404  = 任务过期
"""

import asyncio
import time
from typing import Dict, Any
from celery import Task
from sqlalchemy.orm import Session

from app.tasks.celery_app import celery_app
from app.database import SessionLocal
from app.models.project import Project
from app.services.douhuiai import douhuiai_service
from app.services.project import project_service


class DatabaseTask(Task):
    """自动管理数据库会话的任务基类"""

    _db: Session = None

    @property
    def db(self) -> Session:
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


def _poll_task_until_done(loop, project, db, uuid: str) -> Dict[str, Any]:
    """
    轮询任务状态直到完成或失败

    Args:
        loop: asyncio 事件循环
        project: Project 对象
        db: 数据库会话
        uuid: 豆绘AI任务UUID

    Returns:
        Dict: {"status": "completed"/"failed", "result_urls": [...]}
    """
    max_attempts = 60  # 最多轮询60次，每次等5秒，共5分钟

    for attempt in range(max_attempts):
        status_response = loop.run_until_complete(
            douhuiai_service.get_task_status(uuid)
        )

        api_status = status_response.get("status")

        # 完成
        if api_status == 200:
            result_urls = douhuiai_service.parse_result_urls(status_response)
            project_service.update_project_status(
                db,
                project,
                "completed",
                progress=100,
                result_data={"result_urls": result_urls},
            )
            return {"status": "completed", "result_urls": result_urls}

        # 失败或过期
        if api_status in (500, 404):
            error_msg = status_response.get("msg", f"任务失败（状态码：{api_status}）")
            project_service.update_project_status(
                db, project, "failed", error_message=error_msg
            )
            return {"status": "failed", "error": error_msg}

        # -200 = 进行中，估算进度
        progress = min(10 + attempt * 2, 90)  # 10% ~ 90%
        project_service.update_project_status(
            db, project, "processing", progress=progress
        )

        time.sleep(5)

    # 超时
    project_service.update_project_status(
        db, project, "failed", error_message="Task timeout"
    )
    return {"status": "failed", "error": "Task timeout"}


@celery_app.task(base=DatabaseTask, bind=True, max_retries=3)
def process_text2img_task(self, project_id: int, params: Dict[str, Any] = None):
    """
    处理文生图任务

    Args:
        project_id: 项目ID
        params: 额外参数（保持接口兼容性，实际从 project.input_params 读取）
    """
    db = self.db

    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        project_service.update_project_status(db, project, "processing", progress=10)

        # 若 uuid 已由 API 层设置，直接轮询；否则重新调用创建接口
        uuid = project.uuid
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            if not uuid:
                input_params = project.input_params or {}
                prompt = input_params.get("prompt", "")
                api_response = loop.run_until_complete(
                    douhuiai_service.create_text2img_task(prompt, input_params)
                )
                # UUID 在顶层或 data 中（兼容两种格式）
                uuid = api_response.get("uuid") or api_response.get("data", {}).get("uuid")
                project.uuid = uuid

                # doGenKontext 可能同步返回图片结果
                result_urls = douhuiai_service.parse_edit_result_urls(api_response)
                if result_urls:
                    project_service.update_project_status(
                        db, project, "completed", progress=100,
                        result_data={"result_urls": result_urls},
                    )
                    db.commit()
                    return {"status": "completed", "result_urls": result_urls}
                db.commit()

            return _poll_task_until_done(loop, project, db, uuid)

        finally:
            loop.close()

    except Exception as e:
        try:
            self.retry(countdown=60, exc=e)
        except self.MaxRetriesExceededError:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project_service.update_project_status(
                    db, project, "failed", error_message=str(e)
                )
            raise


@celery_app.task(base=DatabaseTask, bind=True, max_retries=3)
def process_img2img_task(self, project_id: int, params: Dict[str, Any] = None):
    """
    处理图生图任务

    Args:
        project_id: 项目ID
        params: 额外参数（保持接口兼容性）
    """
    db = self.db

    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        project_service.update_project_status(db, project, "processing", progress=10)

        uuid = project.uuid
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            if not uuid:
                import base64 as b64mod
                input_params = project.input_params or {}
                image_url = input_params.get("image_url", "")
                # base64 图片先上传获得 CDN URL
                if image_url.startswith("data:"):
                    header, b64data = image_url.split(",", 1)
                    file_bytes = b64mod.b64decode(b64data)
                    ext = "jpg" if "jpeg" in header else "png"
                    image_url = loop.run_until_complete(
                        douhuiai_service.upload_image(file_bytes, f"upload.{ext}")
                    )
                prompt = input_params.get("prompt", "")
                api_response = loop.run_until_complete(
                    douhuiai_service.create_img2img_task(image_url, prompt, input_params)
                )
                # UUID 在顶层或 data 中（兼容两种格式）
                uuid = api_response.get("uuid") or api_response.get("data", {}).get("uuid")
                project.uuid = uuid

                # doGenKontext 可能同步返回图片结果
                result_urls = douhuiai_service.parse_edit_result_urls(api_response)
                if result_urls:
                    project_service.update_project_status(
                        db, project, "completed", progress=100,
                        result_data={"result_urls": result_urls},
                    )
                    db.commit()
                    return {"status": "completed", "result_urls": result_urls}
                db.commit()

            return _poll_task_until_done(loop, project, db, uuid)

        finally:
            loop.close()

    except Exception as e:
        try:
            self.retry(countdown=60, exc=e)
        except self.MaxRetriesExceededError:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project_service.update_project_status(
                    db, project, "failed", error_message=str(e)
                )
            raise


@celery_app.task(base=DatabaseTask, bind=True, max_retries=3)
def process_edit_task(self, project_id: int, params: Dict[str, Any] = None):
    """
    处理图片编辑任务

    Args:
        project_id: 项目ID
        params: 额外参数（保持接口兼容性）
    """
    db = self.db

    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        project_service.update_project_status(db, project, "processing", progress=10)

        uuid = project.uuid
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            if not uuid:
                import base64 as b64mod
                input_params = project.input_params or {}
                image_url = input_params.get("image_url", "")
                # base64 图片先上传获得 CDN URL
                if image_url.startswith("data:"):
                    header, b64data = image_url.split(",", 1)
                    file_bytes = b64mod.b64decode(b64data)
                    ext = "jpg" if "jpeg" in header else "png"
                    image_url = loop.run_until_complete(
                        douhuiai_service.upload_image(file_bytes, f"upload.{ext}")
                    )
                edit_type = project.subtype or input_params.get("edit_type", "")
                api_response = loop.run_until_complete(
                    douhuiai_service.create_edit_task(image_url, edit_type, input_params)
                )
                # doEdit 响应：{status: 200, uuid: "...", imgs: {...}}，uuid 在顶层
                uuid = api_response.get("uuid")
                project.uuid = uuid

                # doEdit 可能直接同步返回图片结果（imgs.imgs 非空）
                result_urls = douhuiai_service.parse_edit_result_urls(api_response)
                if result_urls:
                    project_service.update_project_status(
                        db, project, "completed", progress=100,
                        result_data={"result_urls": result_urls},
                    )
                    db.commit()
                    return {"status": "completed", "result_urls": result_urls}

                db.commit()

            return _poll_task_until_done(loop, project, db, uuid)

        finally:
            loop.close()

    except Exception as e:
        try:
            self.retry(countdown=60, exc=e)
        except self.MaxRetriesExceededError:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project_service.update_project_status(
                    db, project, "failed", error_message=str(e)
                )
            raise


@celery_app.task(base=DatabaseTask, bind=True, max_retries=3)
def process_3d_render_task(self, project_id: int, params: Dict[str, Any] = None):
    """
    处理3D渲染任务

    Args:
        project_id: 项目ID
        params: 额外参数（保持接口兼容性）
    """
    db = self.db

    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        project_service.update_project_status(db, project, "processing", progress=10)

        uuid = project.uuid
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            if not uuid:
                input_params = project.input_params or {}
                model_type = project.subtype or input_params.get("model_type", "")
                prompt = input_params.get("prompt", "")
                api_response = loop.run_until_complete(
                    douhuiai_service.create_3d_render_task(model_type, prompt, input_params)
                )
                # UUID 在顶层或 data 中（兼容两种格式）
                uuid = api_response.get("uuid") or api_response.get("data", {}).get("uuid")
                project.uuid = uuid

                # doGenKontext 可能同步返回图片结果
                result_urls = douhuiai_service.parse_edit_result_urls(api_response)
                if result_urls:
                    project_service.update_project_status(
                        db, project, "completed", progress=100,
                        result_data={"result_urls": result_urls},
                    )
                    db.commit()
                    return {"status": "completed", "result_urls": result_urls}
                db.commit()

            return _poll_task_until_done(loop, project, db, uuid)

        finally:
            loop.close()

    except Exception as e:
        try:
            self.retry(countdown=60, exc=e)
        except self.MaxRetriesExceededError:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project_service.update_project_status(
                    db, project, "failed", error_message=str(e)
                )
            raise


def _poll_task_until_done_extended(loop, project, db, uuid: str, max_attempts: int = 180) -> Dict[str, Any]:
    """
    扩展版轮询（用于视频等耗时任务）

    与 _poll_task_until_done 逻辑相同，但支持自定义最大轮询次数。
    默认180次 * 5秒 = 15分钟超时。
    """
    for attempt in range(max_attempts):
        status_response = loop.run_until_complete(
            douhuiai_service.get_task_status(uuid)
        )
        api_status = status_response.get("status")

        if api_status == 200:
            result_urls = douhuiai_service.parse_result_urls(status_response)
            project_service.update_project_status(
                db, project, "completed", progress=100,
                result_data={"result_urls": result_urls},
            )
            return {"status": "completed", "result_urls": result_urls}

        if api_status in (500, 404):
            error_msg = status_response.get("msg", f"任务失败（状态码：{api_status}）")
            project_service.update_project_status(
                db, project, "failed", error_message=error_msg
            )
            return {"status": "failed", "error": error_msg}

        progress = min(10 + attempt * 1, 90)
        project_service.update_project_status(
            db, project, "processing", progress=progress
        )
        time.sleep(5)

    project_service.update_project_status(
        db, project, "failed", error_message="Task timeout"
    )
    return {"status": "failed", "error": "Task timeout"}


@celery_app.task(base=DatabaseTask, bind=True, max_retries=3)
def process_repaint_task(self, project_id: int, params: Dict[str, Any] = None):
    """处理图片重绘任务"""
    db = self.db
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")
        project_service.update_project_status(db, project, "processing", progress=10)
        uuid = project.uuid
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            if not uuid:
                import base64 as b64mod
                input_params = project.input_params or {}
                image_url = input_params.get("image_url", "")
                if image_url.startswith("data:"):
                    header, b64data = image_url.split(",", 1)
                    file_bytes = b64mod.b64decode(b64data)
                    ext = "jpg" if "jpeg" in header else "png"
                    image_url = loop.run_until_complete(
                        douhuiai_service.upload_image(file_bytes, f"repaint.{ext}")
                    )
                api_response = loop.run_until_complete(
                    douhuiai_service.create_repaint_task(
                        image_url, input_params.get("prompt", ""),
                        input_params.get("mode", "standard"), input_params.get("params")
                    )
                )
                uuid = api_response.get("uuid")
                project.uuid = uuid
                result_urls = douhuiai_service.parse_edit_result_urls(api_response)
                if result_urls:
                    project_service.update_project_status(
                        db, project, "completed", progress=100,
                        result_data={"result_urls": result_urls},
                    )
                    db.commit()
                    return {"status": "completed", "result_urls": result_urls}
                db.commit()
            return _poll_task_until_done(loop, project, db, uuid)
        finally:
            loop.close()
    except Exception as e:
        try:
            self.retry(countdown=60, exc=e)
        except self.MaxRetriesExceededError:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project_service.update_project_status(db, project, "failed", error_message=str(e))
            raise


@celery_app.task(base=DatabaseTask, bind=True, max_retries=3)
def process_model_create_task(self, project_id: int, params: Dict[str, Any] = None):
    """处理大模型创作任务（Flux/SDXL/N-banana等）"""
    db = self.db
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")
        project_service.update_project_status(db, project, "processing", progress=10)
        uuid = project.uuid
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            if not uuid:
                import base64 as b64mod
                input_params = project.input_params or {}
                model = project.subtype or input_params.get("model", "")
                prompt = input_params.get("prompt", "")
                image_url = input_params.get("image_url")
                if image_url and image_url.startswith("data:"):
                    header, b64data = image_url.split(",", 1)
                    file_bytes = b64mod.b64decode(b64data)
                    ext = "jpg" if "jpeg" in header else "png"
                    image_url = loop.run_until_complete(
                        douhuiai_service.upload_image(file_bytes, f"model.{ext}")
                    )
                api_response = loop.run_until_complete(
                    douhuiai_service.create_model_task(model, prompt, image_url, input_params.get("params"))
                )
                uuid = api_response.get("uuid") or api_response.get("data", {}).get("uuid")
                project.uuid = uuid
                result_urls = douhuiai_service.parse_edit_result_urls(api_response)
                if not result_urls:
                    result_urls = douhuiai_service.parse_result_urls(api_response)
                if result_urls:
                    project_service.update_project_status(
                        db, project, "completed", progress=100,
                        result_data={"result_urls": result_urls},
                    )
                    db.commit()
                    return {"status": "completed", "result_urls": result_urls}
                db.commit()
            return _poll_task_until_done(loop, project, db, uuid)
        finally:
            loop.close()
    except Exception as e:
        try:
            self.retry(countdown=60, exc=e)
        except self.MaxRetriesExceededError:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project_service.update_project_status(db, project, "failed", error_message=str(e))
            raise


@celery_app.task(base=DatabaseTask, bind=True, max_retries=3)
def process_architecture_task(self, project_id: int, params: Dict[str, Any] = None):
    """
    处理建筑室内任务

    Args:
        project_id: 项目ID
        params: 额外参数
    """
    db = self.db

    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        project_service.update_project_status(db, project, "processing", progress=10)

        uuid = project.uuid
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            if not uuid:
                import base64 as b64mod
                input_params = project.input_params or {}
                arch_type = project.subtype or input_params.get("arch_type", "")
                image_url = input_params.get("image_url")
                prompt = input_params.get("prompt")

                if image_url and image_url.startswith("data:"):
                    header, b64data = image_url.split(",", 1)
                    file_bytes = b64mod.b64decode(b64data)
                    ext = "jpg" if "jpeg" in header else "png"
                    image_url = loop.run_until_complete(
                        douhuiai_service.upload_image(file_bytes, f"arch.{ext}")
                    )

                api_response = loop.run_until_complete(
                    douhuiai_service.create_architecture_task(
                        arch_type, image_url, prompt, input_params.get("params")
                    )
                )
                uuid = api_response.get("uuid")
                project.uuid = uuid

                result_urls = douhuiai_service.parse_edit_result_urls(api_response)
                if result_urls:
                    project_service.update_project_status(
                        db, project, "completed", progress=100,
                        result_data={"result_urls": result_urls},
                    )
                    db.commit()
                    return {"status": "completed", "result_urls": result_urls}

                db.commit()

            return _poll_task_until_done(loop, project, db, uuid)

        finally:
            loop.close()

    except Exception as e:
        try:
            self.retry(countdown=60, exc=e)
        except self.MaxRetriesExceededError:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project_service.update_project_status(
                    db, project, "failed", error_message=str(e)
                )
            raise


@celery_app.task(base=DatabaseTask, bind=True, max_retries=3)
def process_video_task(self, project_id: int, params: Dict[str, Any] = None):
    """
    处理视频创作任务

    视频任务耗时较长，使用扩展轮询（15分钟超时）。

    Args:
        project_id: 项目ID
        params: 额外参数
    """
    db = self.db

    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        project_service.update_project_status(db, project, "processing", progress=5)

        uuid = project.uuid
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            if not uuid:
                import base64 as b64mod
                input_params = project.input_params or {}
                video_type = project.subtype or input_params.get("video_type", "")
                prompt = input_params.get("prompt", "")
                image_url = input_params.get("image_url")

                # base64 图片上传到 CDN
                if image_url and image_url.startswith("data:"):
                    header, b64data = image_url.split(",", 1)
                    file_bytes = b64mod.b64decode(b64data)
                    ext = "jpg" if "jpeg" in header else "png"
                    image_url = loop.run_until_complete(
                        douhuiai_service.upload_image(file_bytes, f"video_input.{ext}")
                    )

                # 文生音频走单独方法
                if video_type == "text2voice":
                    extra = input_params.get("params") or {}
                    api_response = loop.run_until_complete(
                        douhuiai_service.create_audio_task(
                            prompt, str(extra.get("dhVoiceId", "")),
                            extra.get("dhEmotion")
                        )
                    )
                else:
                    api_response = loop.run_until_complete(
                        douhuiai_service.create_video_task(
                            video_type, prompt, image_url, input_params.get("params")
                        )
                    )

                uuid = api_response.get("uuid")
                project.uuid = uuid

                # 可能直接返回结果
                result_urls = douhuiai_service.parse_edit_result_urls(api_response)
                if result_urls:
                    project_service.update_project_status(
                        db, project, "completed", progress=100,
                        result_data={"result_urls": result_urls},
                    )
                    db.commit()
                    return {"status": "completed", "result_urls": result_urls}

                db.commit()

            # 视频任务使用扩展轮询（15分钟超时）
            return _poll_task_until_done_extended(loop, project, db, uuid, max_attempts=180)

        finally:
            loop.close()

    except Exception as e:
        try:
            self.retry(countdown=60, exc=e)
        except self.MaxRetriesExceededError:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project_service.update_project_status(
                    db, project, "failed", error_message=str(e)
                )
            raise


@celery_app.task(base=DatabaseTask, bind=True, max_retries=3)
def process_ecommerce_task(self, project_id: int, params: Dict[str, Any] = None):
    """
    处理产品电商任务

    Args:
        project_id: 项目ID
        params: 额外参数
    """
    db = self.db

    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        project_service.update_project_status(db, project, "processing", progress=10)

        uuid = project.uuid
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            if not uuid:
                import base64 as b64mod
                input_params = project.input_params or {}
                ecommerce_type = project.subtype or input_params.get("ecommerce_type", "")
                image_url = input_params.get("image_url", "")
                prompt = input_params.get("prompt")

                # base64 图片上传到 CDN
                if image_url.startswith("data:"):
                    header, b64data = image_url.split(",", 1)
                    file_bytes = b64mod.b64decode(b64data)
                    ext = "jpg" if "jpeg" in header else "png"
                    image_url = loop.run_until_complete(
                        douhuiai_service.upload_image(file_bytes, f"product.{ext}")
                    )

                api_response = loop.run_until_complete(
                    douhuiai_service.create_ecommerce_task(
                        ecommerce_type, image_url, prompt, input_params.get("params")
                    )
                )
                uuid = api_response.get("uuid")
                project.uuid = uuid

                # 可能直接返回图片结果
                result_urls = douhuiai_service.parse_edit_result_urls(api_response)
                if result_urls:
                    project_service.update_project_status(
                        db, project, "completed", progress=100,
                        result_data={"result_urls": result_urls},
                    )
                    db.commit()
                    return {"status": "completed", "result_urls": result_urls}

                db.commit()

            return _poll_task_until_done(loop, project, db, uuid)

        finally:
            loop.close()

    except Exception as e:
        try:
            self.retry(countdown=60, exc=e)
        except self.MaxRetriesExceededError:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project_service.update_project_status(
                    db, project, "failed", error_message=str(e)
                )
            raise


@celery_app.task(base=DatabaseTask, bind=True, max_retries=3)
def process_portrait_task(self, project_id: int, params: Dict[str, Any] = None):
    """
    处理人像写真任务

    人像写真分两类端点：
    - 专用端点（换脸/修复/证件照/写真）：返回 {status, uuid, imgs}
    - doEdit端点（变清晰/上色/换发型/转漫画）：同 edit 流程

    Args:
        project_id: 项目ID
        params: 额外参数
    """
    db = self.db

    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        project_service.update_project_status(db, project, "processing", progress=10)

        uuid = project.uuid
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            if not uuid:
                import base64 as b64mod
                input_params = project.input_params or {}
                portrait_type = project.subtype or input_params.get("portrait_type", "")
                image_url = input_params.get("image_url", "")
                face_url = input_params.get("face_url")

                # base64 图片上传到 CDN
                if image_url.startswith("data:"):
                    header, b64data = image_url.split(",", 1)
                    file_bytes = b64mod.b64decode(b64data)
                    ext = "jpg" if "jpeg" in header else "png"
                    image_url = loop.run_until_complete(
                        douhuiai_service.upload_image(file_bytes, f"portrait.{ext}")
                    )
                if face_url and face_url.startswith("data:"):
                    header, b64data = face_url.split(",", 1)
                    file_bytes = b64mod.b64decode(b64data)
                    ext = "jpg" if "jpeg" in header else "png"
                    face_url = loop.run_until_complete(
                        douhuiai_service.upload_image(file_bytes, f"face.{ext}")
                    )

                api_response = loop.run_until_complete(
                    douhuiai_service.create_portrait_task(
                        portrait_type, image_url, face_url, input_params.get("params")
                    )
                )
                uuid = api_response.get("uuid")
                project.uuid = uuid

                # 专用端点可能直接返回图片结果
                result_urls = douhuiai_service.parse_edit_result_urls(api_response)
                if result_urls:
                    project_service.update_project_status(
                        db, project, "completed", progress=100,
                        result_data={"result_urls": result_urls},
                    )
                    db.commit()
                    return {"status": "completed", "result_urls": result_urls}

                db.commit()

            return _poll_task_until_done(loop, project, db, uuid)

        finally:
            loop.close()

    except Exception as e:
        try:
            self.retry(countdown=60, exc=e)
        except self.MaxRetriesExceededError:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project_service.update_project_status(
                    db, project, "failed", error_message=str(e)
                )
            raise


@celery_app.task
def cleanup_old_projects():
    """
    清理旧项目（定时任务）

    删除30天前已完成或失败的项目
    """
    from datetime import datetime, timedelta

    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=30)

        old_projects = (
            db.query(Project)
            .filter(
                Project.status.in_(["completed", "failed"]),
                Project.updated_at < cutoff_date,
                Project.deleted_at == None,
            )
            .all()
        )

        for project in old_projects:
            project.soft_delete()

        db.commit()

        return {"deleted": len(old_projects)}

    finally:
        db.close()
