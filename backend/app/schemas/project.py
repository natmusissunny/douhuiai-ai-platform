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
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

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


class RepaintRequest(BaseModel):
    """图片重绘请求"""
    image_url: str = Field(..., description="输入图片URL")
    prompt: str = Field(..., min_length=1, max_length=2000, description="描述")
    mode: str = Field("standard", description="重绘模式: standard/smart")
    params: Optional[Dict[str, Any]] = Field(None, description="额外参数（dhDenoise/dhModel/dhLoraIds等）")


class ModelCreateRequest(BaseModel):
    """大模型创作请求"""
    model: str = Field(..., description="模型类型: flux/sdxl/nanoimg/midjourney/kontext")
    prompt: str = Field(..., min_length=1, max_length=2000, description="描述")
    image_url: Optional[str] = Field(None, description="参考图URL（可选）")
    params: Optional[Dict[str, Any]] = Field(None, description="额外参数")


class ArchitectureRequest(BaseModel):
    """建筑室内请求"""
    arch_type: str = Field(..., description="建筑功能类型: concept/arch_3d/line_render/color_cad/rough_to_fine/add_model_smart/furnish_smart/arch_upscale 等")
    image_url: Optional[str] = Field(None, description="输入图片URL")
    prompt: Optional[str] = Field(None, max_length=2000, description="描述/指令")
    params: Optional[Dict[str, Any]] = Field(None, description="额外参数（dhLoraIds/dhPaintStyle/dhMaskImg等）")


class VideoRequest(BaseModel):
    """视频创作请求"""
    video_type: str = Field(..., description="视频功能类型: text2video/image2video/frames2video/sora2video/presenter/text2videoaudio/image2videoaudio/text2voice")
    prompt: str = Field(..., min_length=1, max_length=2000, description="视频/音频描述")
    image_url: Optional[str] = Field(None, description="输入图片URL（图生视频等需要）")
    params: Optional[Dict[str, Any]] = Field(None, description="额外参数（dhDuration/dhMode/dhResolution/dhVoiceId等）")


class EcommerceRequest(BaseModel):
    """产品电商请求"""
    image_url: str = Field(..., description="产品图URL")
    ecommerce_type: str = Field(..., description="电商功能类型: white_bg/scene_bg/selling_point/detail_enhance/virtual_tryon/product_design 及商品图编辑工具")
    prompt: Optional[str] = Field(None, max_length=2000, description="自定义描述")
    params: Optional[Dict[str, Any]] = Field(None, description="额外参数（dhDesignMode/dhImgNum/dhResolution等）")


class PortraitRequest(BaseModel):
    """人像写真请求"""
    image_url: str = Field(..., description="主图URL")
    portrait_type: str = Field(..., description="人像功能类型: face_swap/old_photo_repair/portrait_hd/colorize/id_photo/ai_portrait/hair_change/people2cartoon")
    face_url: Optional[str] = Field(None, description="人脸参考图URL（换脸/证件照/写真需要）")
    params: Optional[Dict[str, Any]] = Field(None, description="额外参数（如老照片修复的blurLevel）")


class Render3DRequest(BaseModel):
    """3D渲染请求"""
    model_type: str = Field(..., description="模型类型")
    prompt: str = Field(..., min_length=1, max_length=2000, description="描述")
    render_quality: str = Field("medium", description="渲染质量: low/medium/high")
