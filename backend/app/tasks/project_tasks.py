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
                uuid = api_response.get("data", {}).get("uuid")
                project.uuid = uuid
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
                uuid = api_response.get("data", {}).get("uuid")
                project.uuid = uuid
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
                uuid = api_response.get("data", {}).get("uuid")
                project.uuid = uuid
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
