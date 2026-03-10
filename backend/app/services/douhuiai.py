"""
豆绘AI API 服务

接口规格（来自官方文档）：
- Base URL: https://dhd.douhuiai.com
- 认证: Authorization: Bearer {appsecret}
- 请求格式: multipart/form-data
- 轮询状态码: 200=完成, -200=进行中, 500=失败, 404=过期
- 图片访问前缀: https://img2.douhuiai.com/dhimg/
"""

import httpx
from typing import Dict, Any, Optional
from app.config import settings


class DouhuiAIService:
    """豆绘AI API 服务类"""

    def __init__(self):
        self.base_url = settings.DOUHUIAI_API_URL
        self.app_id = settings.DOUHUIAI_APP_ID
        self.app_secret = settings.DOUHUIAI_APP_SECRET
        self.img_base_url = settings.DOUHUIAI_IMG_BASE_URL
        self.timeout = 30.0

    def _get_headers(self) -> Dict[str, str]:
        """
        获取请求头（不含 Content-Type，由 httpx 根据 data= 自动设置）

        Returns:
            Dict: 请求头
        """
        return {
            "Authorization": f"Bearer {self.app_secret}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        }

    def _build_image_url(self, filename: str) -> str:
        """
        拼接完整图片URL

        Args:
            filename: imglist 中的文件名

        Returns:
            str: 完整图片地址
        """
        if filename.startswith("http"):
            return filename
        return f"{self.img_base_url}{filename}"

    async def create_text2img_task(
        self, prompt: str, params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        创建文生图任务

        接口: POST /api/aiart/doGenKontext
        参数（form-data）:
            dhAiType = "kontextimg"
            dhMode = "text"
            dhPrompt = 提示词
            dhImgNum = 生成数量（1-2）
            dhImgSize = -1（使用自定义比例）
            dhImgRatio = 比例，如 "1:1"

        Returns:
            Dict: {"code": "200", "msg": "...", "data": {"uuid": "..."}}
        """
        num_images = min(int(params.get("num_images", 1)), 2)
        form_data = {
            "dhAiType": "kontextimg",
            "dhMode": "text",
            "dhPrompt": prompt,
            "dhImgNum": str(num_images),
            "dhImgSize": "-1",
            "dhImgRatio": "1:1",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/aiart/doGenKontext",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()

            # 检查业务错误
            if str(result.get("code", "")) != "200":
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")

            return result

    async def create_img2img_task(
        self, image_url: str, prompt: str, params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        创建图生图任务

        接口: POST /api/aiart/doGenKontext
        参数（form-data）:
            dhAiType = "kontextimg"
            dhMode = "img"（图生图模式）
            dhPrompt = 提示词
            dhImgUrl = 参考图URL
            dhImgNum = 生成数量

        Returns:
            Dict: {"code": "200", "data": {"uuid": "..."}}
        """
        num_images = min(int(params.get("num_images", 1)), 2)
        form_data = {
            "dhAiType": "kontextimg",
            "dhMode": "img",
            "dhPrompt": prompt,
            "dhImgUrl": image_url,
            "dhImgNum": str(num_images),
            "dhImgSize": "-1",
            "dhImgRatio": "1:1",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/aiart/doGenKontext",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()

            if str(result.get("code", "")) != "200":
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")

            return result

    # 前端 edit_type → 豆绘API dhSubAiType 映射表
    EDIT_TYPE_MAP = {
        "upscale":       {"dhSubAiType": "upscale",      "dhAiSubType": "upscale4k", "dhMode": "1"},  # 高清放大
        "hd_repaint":    {"dhSubAiType": "repainting",   "dhAiSubType": "upscale2k"},                # 高清重绘
        "outpaint":      {"dhSubAiType": "outpaint"},                                                 # AI扩图
        "remove_bg":     {"dhSubAiType": "ps"},                                                       # AI抠图
        "change_bg":     {"dhSubAiType": "changebg",     "dhMode": "1", "dhImgNum": "2"},             # 换背景
        "inpaint":       {"dhSubAiType": "remove"},                                                   # 万物消除
        "local_edit":    {"dhSubAiType": "localedit"},                                                # 局部修改
        "style_transfer":{"dhSubAiType": "changestyle"},                                              # 换风格
        "sharpen":       {"dhSubAiType": "photoclear",   "dhRefMode": "2"},                           # 变清晰
        "local_repair":  {"dhSubAiType": "localrepair"},                                              # 局部修复
        "replace":       {"dhSubAiType": "replace"},                                                  # 万物替换
        "beautify":      {"dhSubAiType": "imgrefined",   "dhRefMode": "1"},                           # 一键美化
        "to_sketch":     {"dhSubAiType": "tosketch"},                                                 # 图片转线稿
        "extract_line":  {"dhSubAiType": "extractline"},                                              # 精准提取线稿
        "decolor":       {"dhSubAiType": "decolor"},                                                  # 图片去色
        "remove_text":   {"dhSubAiType": "removewatermark"},                                          # 去Logo/文字
        "universal_edit":{"dhSubAiType": "universaledit"},                                            # 万能改图
        "crop":          {"dhSubAiType": "crop"},                                                     # 图片裁剪
        "ratio":         {"dhSubAiType": "ratio"},                                                    # 比例调整
    }

    async def create_edit_task(
        self, image_url: str, edit_type: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        创建图片编辑任务

        接口: POST /api/aiart/doEdit
        参数:
            dhAiType    = "editimage"（固定）
            dhInputImg  = 图片URL
            dhSubAiType = 具体功能标识（通过 EDIT_TYPE_MAP 映射）
            其他参数按功能类型补充

        Returns:
            Dict: {"status": 200, "uuid": "...", "imgs": {...}}
        """
        # 获取映射参数，未知类型退化为通用美化
        type_params = self.EDIT_TYPE_MAP.get(edit_type, {"dhSubAiType": "imgrefined", "dhRefMode": "2"})

        form_data: Dict[str, str] = {
            "dhAiType": "editimage",
            "dhInputImg": image_url,
        }
        # 合并类型特定参数（全部转为字符串）
        for k, v in type_params.items():
            form_data[k] = str(v)

        # 外部 params 可覆盖（如指定 dhMode 等）
        if params:
            for k, v in params.items():
                if k.startswith("dh"):
                    form_data[k] = str(v)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/aiart/doEdit",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()

            # doEdit 直接返回 {status, uuid, imgs}，status!=200 表示错误
            if result.get("status") != 200:
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")

            return result

    async def create_3d_render_task(
        self, model_type: str, prompt: str, params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        创建3D渲染任务

        接口: POST /api/aiart/doGenKontext
        使用 3D 相关的 dhAiType

        Returns:
            Dict: {"code": "200", "data": {"uuid": "..."}}
        """
        form_data = {
            "dhAiType": model_type or "3d",
            "dhMode": "text",
            "dhPrompt": prompt,
            "dhImgSize": "-1",
            "dhImgRatio": "1:1",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/aiart/doGenKontext",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()

            if str(result.get("code", "")) != "200":
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")

            return result

    async def get_task_status(self, uuid: str) -> Dict[str, Any]:
        """
        轮询任务状态

        接口: GET /api/aiart/queryStatus?uuid={uuid}&source=api
        响应状态码：
            200  = 完成，imglist 中有文件名
            -200 = 进行中
            500  = 失败
            404  = 任务过期

        Returns:
            Dict: {"status": int, "imglist": [...], ...}
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/api/aiart/queryStatus",
                headers=self._get_headers(),
                params={"uuid": uuid, "source": "api"},
            )
            # 豆绘 API 对无效 UUID 返回 HTTP 404 + HTML，而非 JSON
            # 统一映射为业务状态 404（任务过期/不存在）
            if response.status_code == 404:
                return {"status": 404, "msg": "任务不存在或已过期"}
            response.raise_for_status()
            try:
                return response.json()
            except Exception:
                # 非 JSON 响应（如 502/504 网关错误页），视为任务进行中
                return {"status": -200, "msg": f"状态查询异常（HTTP {response.status_code}）"}

    async def upload_image(self, file_bytes: bytes, filename: str = "upload.jpg") -> str:
        """
        上传图片到豆绘AI

        接口: POST /api/index/apiupload
        参数: file（二进制，multipart/form-data）

        Returns:
            str: 完整图片URL
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/index/apiupload",
                headers=self._get_headers(),
                files={"file": (filename, file_bytes, "image/jpeg")},
            )
            response.raise_for_status()
            result = response.json()

            # 实际响应：{"code": 200, "url": "...", "msg": "上传成功"}
            if result.get("code") != 200:
                raise ValueError(f"上传失败: {result.get('msg', '未知错误')}")

            return result.get("url", "")

    def parse_result_urls(self, status_response: Dict[str, Any]) -> list:
        """
        从 queryStatus 响应中提取完整图片URL列表（适用于 text2img / img2img / 3d_render）

        Args:
            status_response: queryStatus 接口的响应

        Returns:
            list: 完整图片URL列表
        """
        imglist = status_response.get("imglist", [])
        return [self._build_image_url(filename) for filename in imglist if filename]

    def parse_edit_result_urls(self, edit_response: Dict[str, Any]) -> list:
        """
        从 doEdit 响应中提取完整图片URL列表

        doEdit 响应格式：
            {"status": 200, "uuid": "...", "imgs": {"grid": "...", "imgs": ["url1", ...]}}
        imgs.imgs 中的元素可能是完整URL或文件名

        Args:
            edit_response: doEdit 接口或 queryStatus 接口的响应

        Returns:
            list: 完整图片URL列表
        """
        # doEdit 直接返回格式
        imgs_obj = edit_response.get("imgs", {})
        if imgs_obj:
            imgs_list = imgs_obj.get("imgs", [])
            if imgs_list:
                return [self._build_image_url(url) for url in imgs_list if url]

        # 降级：也尝试 imglist（轮询接口）
        imglist = edit_response.get("imglist", [])
        return [self._build_image_url(filename) for filename in imglist if filename]


# 单例
douhuiai_service = DouhuiAIService()
