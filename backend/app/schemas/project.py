"""
项目相关的 Pydantic 模型
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal


class ProjectCreate(BaseModel):
    """创建项目请求"""
    type: str = Field(..., description="任务类型: text2img/img2img/edit/3d_render")
    subtype: Optional[str] = Field(None, description="任务子类型")
    input_params: Dict[str, Any] = Field(..., description="输入参数")
    prompt: Optional[str] = Field(None, description="提示词")


class ProjectResponse(BaseModel):
    """项目响应"""
    id: int
    uuid: str
    type: str
    subtype: Optional[str]
    status: str
    progress: int
    input_params: Dict[str, Any]
    result_url: Optional[str]
    result_urls: Optional[List[str]]
    quota_cost: Decimal
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """项目列表响应"""
    total: int
    items: List[ProjectResponse]


class ProjectStatusUpdate(BaseModel):
    """更新项目状态"""
    status: str
    progress: Optional[int] = None
    result_url: Optional[str] = None
    result_urls: Optional[List[str]] = None
    error_message: Optional[str] = None


class Text2ImgRequest(BaseModel):
    """文生图请求"""
    prompt: str = Field(..., min_length=1, max_length=2000, description="文字描述")
    negative_prompt: Optional[str] = Field(None, max_length=2000, description="负面提示词")
    width: int = Field(512, ge=256, le=2048, description="图片宽度")
    height: int = Field(512, ge=256, le=2048, description="图片高度")
    steps: int = Field(20, ge=1, le=100, description="迭代步数")
    guidance_scale: float = Field(7.5, ge=0, le=20, description="引导系数")
    num_images: int = Field(1, ge=1, le=4, description="生成图片数量")
    seed: Optional[int] = Field(None, description="随机种子")
    style: Optional[str] = Field(None, description="风格")


class Img2ImgRequest(BaseModel):
    """图生图请求"""
    image_url: str = Field(..., description="输入图片URL")
    prompt: str = Field(..., min_length=1, max_length=2000, description="文字描述")
    negative_prompt: Optional[str] = Field(None, max_length=2000, description="负面提示词")
    strength: float = Field(0.8, ge=0, le=1, description="强度")
    steps: int = Field(20, ge=1, le=100, description="迭代步数")
    guidance_scale: float = Field(7.5, ge=0, le=20, description="引导系数")
    seed: Optional[int] = Field(None, description="随机种子")


class ImageEditRequest(BaseModel):
    """图片编辑请求"""
    image_url: str = Field(..., description="输入图片URL")
    edit_type: str = Field(..., description="编辑类型: remove_bg/style_transfer/upscale")
    params: Optional[Dict[str, Any]] = Field(None, description="编辑参数")


class Render3DRequest(BaseModel):
    """3D渲染请求"""
    model_type: str = Field(..., description="模型类型")
    prompt: str = Field(..., min_length=1, max_length=2000, description="描述")
    render_quality: str = Field("medium", description="渲染质量: low/medium/high")
