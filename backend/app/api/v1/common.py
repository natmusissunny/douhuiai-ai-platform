"""
公共数据查询接口

提供模型列表、画风列表、分类列表、Lora模板、ControlNet列表、出图尺寸、账户余额等公共数据。
这些接口代理豆绘AI官方API，供前端动态加载选项使用。
"""

import time
from typing import Any, Dict, Optional

from fastapi import APIRouter, Query

from app.services.douhuiai import douhuiai_service

router = APIRouter()

# 简易内存缓存（key → (timestamp, data)），避免频繁请求外部API
_cache: Dict[str, tuple] = {}
CACHE_TTL = 300  # 缓存5分钟


def _get_cached(key: str) -> Optional[Any]:
    """获取缓存数据，过期返回None"""
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
    return None


def _set_cached(key: str, data: Any) -> None:
    """写入缓存"""
    _cache[key] = (time.time(), data)


@router.get("/models")
async def get_models(aitype: str = Query(default="", description="创作类型筛选")):
    """获取模型列表"""
    cache_key = f"models:{aitype}"
    cached = _get_cached(cache_key)
    if cached:
        return cached
    result = await douhuiai_service.get_model_list(aitype)
    _set_cached(cache_key, result)
    return result


@router.get("/styles")
async def get_styles():
    """获取画风列表"""
    cached = _get_cached("styles")
    if cached:
        return cached
    result = await douhuiai_service.get_style_list()
    _set_cached("styles", result)
    return result


@router.get("/categories")
async def get_categories(pid: str = Query(default="0", description="父级分类ID")):
    """获取分类列表"""
    cache_key = f"categories:{pid}"
    cached = _get_cached(cache_key)
    if cached:
        return cached
    result = await douhuiai_service.get_category_list(pid)
    _set_cached(cache_key, result)
    return result


@router.get("/lora")
async def get_lora(aitype: str = Query(default="", description="创作类型筛选")):
    """获取Lora主题模板列表"""
    cache_key = f"lora:{aitype}"
    cached = _get_cached(cache_key)
    if cached:
        return cached
    result = await douhuiai_service.get_lora_list(aitype)
    _set_cached(cache_key, result)
    return result


@router.get("/controlnet")
async def get_controlnet(aitype: str = Query(default="", description="创作类型筛选")):
    """获取ControlNet列表"""
    cache_key = f"controlnet:{aitype}"
    cached = _get_cached(cache_key)
    if cached:
        return cached
    result = await douhuiai_service.get_controlnet_list(aitype)
    _set_cached(cache_key, result)
    return result


@router.get("/sizes")
async def get_sizes(aitype: str = Query(default="", description="创作类型筛选")):
    """获取AI创作出图尺寸"""
    cache_key = f"sizes:{aitype}"
    cached = _get_cached(cache_key)
    if cached:
        return cached
    result = await douhuiai_service.get_image_sizes(aitype)
    _set_cached(cache_key, result)
    return result


@router.get("/voices")
async def get_voices():
    """获取音色列表（用于文生音频）"""
    cached = _get_cached("voices")
    if cached:
        return cached
    result = await douhuiai_service.get_voice_list()
    _set_cached("voices", result)
    return result


@router.get("/account/balance")
async def get_account_balance():
    """获取API账户积分余额"""
    # 余额不缓存，实时查询
    return await douhuiai_service.get_account_balance()
