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
        # 获取映射参数，先查主映射表，再查扩展映射表，未知类型退化为通用美化
        type_params = (
            self.EDIT_TYPE_MAP.get(edit_type)
            or self.EDIT_TYPE_MAP_EXTENDED.get(edit_type)
            or {"dhSubAiType": "imgrefined", "dhRefMode": "2"}
        )

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

    # ===== AI创作扩展接口 =====

    # 大模型创作映射（各自有独立端点）
    CREATION_MODEL_MAP = {
        "flux":      {"endpoint": "/api/aiart/doGenflux",     "dhAiType": "flux"},
        "sdxl":      {"endpoint": "/api/aiart/doGensd",       "dhAiType": "sd"},
        "nanoimg":   {"endpoint": "/api/aiart/doGennanoimg",  "dhAiType": "nanoimg"},
        "midjourney":{"endpoint": "/api/aiart/doGenKontext",  "dhAiType": "kontextimg"},
        "kontext":   {"endpoint": "/api/aiart/doGenKontext",  "dhAiType": "kontextimg"},
    }

    async def create_model_task(
        self, model: str, prompt: str, image_url: Optional[str] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        创建大模型创作任务（Flux/SDXL/N-banana等）

        Args:
            model: 模型类型（flux/sdxl/nanoimg/midjourney/kontext）
            prompt: 描述
            image_url: 参考图（可选）
            params: 额外参数（dhLoraIds/dhPaintStyle/dhImgNum等）
        """
        config = self.CREATION_MODEL_MAP.get(model)
        if not config:
            raise ValueError(f"未知的创作模型: {model}")

        extra = params or {}
        form_data: Dict[str, str] = {
            "dhAiType": config["dhAiType"],
            "dhPrompt": prompt,
            "dhImgNum": str(extra.get("dhImgNum", "1")),
            "dhImgSize": str(extra.get("dhImgSize", "-1")),
            "dhImgRatio": str(extra.get("dhImgRatio", "1:1")),
        }
        if image_url:
            form_data["dhInputImg"] = image_url
            form_data["dhMode"] = "img"
        else:
            form_data["dhMode"] = "text"

        for key in ("dhLoraIds", "dhPaintStyle", "dhRefImg", "dhRefSth", "dhModelId"):
            if key in extra:
                form_data[key] = str(extra[key])

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}{config['endpoint']}",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()

            # 不同端点响应格式略有不同
            code = result.get("code") or result.get("status")
            if str(code) not in ("200",):
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")
            return result

    async def create_repaint_task(
        self, image_url: str, prompt: str, mode: str = "standard",
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        创建图片重绘任务（标准重绘/智能重绘）

        接口: POST /api/aiart/doGenrepainting

        Args:
            image_url: 输入图片URL
            prompt: 描述
            mode: 重绘模式（standard/smart）
            params: 额外参数
        """
        extra = params or {}
        form_data: Dict[str, str] = {
            "dhAiType": "repainting",
            "dhMode": mode,
            "dhInputImg": image_url,
            "dhPrompt": prompt,
            "dhDenoise": str(extra.get("dhDenoise", "0.5")),
            "dhImgNum": str(extra.get("dhImgNum", "1")),
        }
        if extra.get("dhModel"):
            form_data["dhModel"] = str(extra["dhModel"])
        for key in ("dhLoraIds", "dhPaintStyle", "dhRefImg", "dhRefSth",
                     "dhRefImg2", "dhRefSth2", "dhFaceImg", "dhFaceSth"):
            if key in extra:
                form_data[key] = str(extra[key])

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/aiart/doGenrepainting",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()
            if result.get("status") != 200:
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")
            return result

    async def create_blender_task(
        self, image_urls: list, prompt: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        创建多图融合任务

        接口: POST /api/aiart/doBlenderCreate
        """
        import json
        extra = params or {}
        form_data: Dict[str, str] = {
            "dhAiType": "blender",
            "dhInputImgs": json.dumps(image_urls),
            "dhPrompt": prompt,
            "dhImgNum": str(extra.get("dhImgNum", "1")),
        }
        for key in ("dhImgSize", "dhImgRatio"):
            if key in extra:
                form_data[key] = str(extra[key])

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/aiart/doBlenderCreate",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()
            if result.get("status") != 200:
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")
            return result

    # ===== 编辑应用补全 =====
    # 在 EDIT_TYPE_MAP 基础上补充剩余编辑应用工具
    EDIT_TYPE_MAP_EXTENDED = {
        "reverse_prompt":  {"dhSubAiType": "reverseprompt"},                        # 描述词反推
        "img_refine":      {"dhSubAiType": "imgrefined", "dhRefMode": "2"},        # 图片精修2.0
        "similar_gen":     {"dhSubAiType": "similargen"},                           # 相似图生成（一键裂变）
        "similar_custom":  {"dhSubAiType": "similarcustom"},                        # 相似图（自定义设置）
        "multi_pose":      {"dhSubAiType": "multipose"},                            # 人物多姿势
        "png_gen":         {"dhSubAiType": "pnggen"},                               # PNG素材生成
        "line_render_edit":{"dhSubAiType": "linerender"},                           # 线稿渲染
        "style_material":  {"dhSubAiType": "stylematerial"},                        # 风格材质转换
        "people2cartoon":  {"dhSubAiType": "people2cartoon"},                       # 真人转漫画
        "model_render":    {"dhSubAiType": "modelrender"},                          # 3D模型渲染
    }

    # ===== 建筑室内接口 =====

    # 专用端点类（各自有独立 API 路径）
    ARCH_ENDPOINT_MAP = {
        "concept":     {"endpoint": "/api/aiart/doGenidconcept", "dhAiType": "idconcept"},     # AI概念图
        "arch_3d":     {"endpoint": "/api/aiart/doGenidmodel",   "dhAiType": "idmodel"},       # 3D渲染
        "line_render": {"endpoint": "/api/aiart/doGenidline",    "dhAiType": "idline"},        # 线稿渲染
        "color_cad":   {"endpoint": "/api/aiart/doGencolorcad",  "dhAiType": "colorcad"},      # 彩平图
        "rough_to_fine":{"endpoint": "/api/aiart/doGenroughcast","dhAiType": "roughcast"},     # 毛坯房精装
    }

    # doMixGen 类（场景加模特 + 软硬装替换）
    ARCH_MIXGEN_MAP = {
        "add_model_smart":   {"dhAiType": "addcharacter",   "dhMode": "smart"},   # 智能加模特
        "add_model_paint":   {"dhAiType": "addcharacter",   "dhMode": "paint"},   # 涂抹区域增加
        "add_model_repair":  {"dhAiType": "addcharacter",   "dhMode": "repair"},  # 模特优化修复
        "furnish_smart":     {"dhAiType": "furnishreplace", "dhMode": "smart"},   # 软硬装智能替换
        "furnish_paint":     {"dhAiType": "furnishreplace", "dhMode": "paint"},   # 涂抹区域替换
    }

    # doEdit 类（效果图后期，补充建筑专属工具）
    ARCH_EDIT_MAP = {
        "arch_upscale":     {"dhSubAiType": "upscale", "dhAiSubType": "upscale4k", "dhMode": "1"},  # 高清放大
        "arch_wash":        {"dhSubAiType": "aiwash"},                                                # AI洗图
        "arch_hd_repaint":  {"dhSubAiType": "repainting", "dhAiSubType": "upscale2k"},               # 高清重绘
        "arch_clear":       {"dhSubAiType": "photoclear", "dhRefMode": "2"},                         # 变清晰
        "arch_daynight":    {"dhSubAiType": "daynight"},                                              # 日夜气候切换
        "arch_style":       {"dhSubAiType": "changestyle"},                                           # 风格迁移
        "arch_erase":       {"dhSubAiType": "remove"},                                                # 涂抹消除
        "arch_local_repair":{"dhSubAiType": "localrepair"},                                           # 局部修复
        "arch_local_edit":  {"dhSubAiType": "localedit"},                                             # 局部修改
        "arch_replace":     {"dhSubAiType": "replace"},                                               # 局部替换
        "arch_sketch":      {"dhSubAiType": "extractline"},                                           # 线稿提取
        "arch_smart_edit":  {"dhSubAiType": "universaledit"},                                         # AI智能改图
        "arch_transform":   {"dhSubAiType": "changestyle"},                                           # 风格转换
    }

    async def create_architecture_task(
        self, arch_type: str, image_url: Optional[str] = None,
        prompt: Optional[str] = None, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        创建建筑室内任务

        根据 arch_type 选择专用端点、doMixGen 或 doEdit。

        Args:
            arch_type: 建筑功能类型
            image_url: 输入图片URL
            prompt: 描述/指令
            params: 额外参数

        Returns:
            Dict: API响应（含 uuid）
        """
        extra = params or {}

        # doEdit 类
        if arch_type in self.ARCH_EDIT_MAP:
            type_params = dict(self.ARCH_EDIT_MAP[arch_type])
            type_params.update({k: str(v) for k, v in extra.items() if k.startswith("dh")})
            return await self.create_edit_task(image_url or "", arch_type, type_params)

        # doMixGen 类
        if arch_type in self.ARCH_MIXGEN_MAP:
            config = self.ARCH_MIXGEN_MAP[arch_type]
            form_data: Dict[str, str] = {
                "dhAiType": config["dhAiType"],
                "dhMode": config["dhMode"],
                "dhInputImg": image_url or "",
                "dhPrompt": prompt or "",
                "dhImgNum": str(extra.get("dhImgNum", "1")),
            }
            # 涂抹模式需要蒙版图
            if extra.get("dhMaskImg"):
                form_data["dhMaskImg"] = str(extra["dhMaskImg"])
            for k, v in extra.items():
                if k.startswith("dh") and k not in form_data:
                    form_data[k] = str(v)

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/aiart/doMixGen",
                    headers=self._get_headers(),
                    data=form_data,
                )
                response.raise_for_status()
                result = response.json()
                if result.get("status") != 200:
                    raise ValueError(f"API错误: {result.get('msg', '未知错误')}")
                return result

        # 专用端点类
        config = self.ARCH_ENDPOINT_MAP.get(arch_type)
        if not config:
            raise ValueError(f"未知的建筑功能类型: {arch_type}")

        form_data = {
            "dhAiType": config["dhAiType"],
            "dhPrompt": prompt or "",
            "dhImgNum": str(extra.get("dhImgNum", "1")),
        }
        if image_url:
            form_data["dhInputImg"] = image_url
        # 可选参数（Lora/画风/参考图/ControlNet等）
        for key in ("dhLoraIds", "dhPaintStyle", "dhRefImg", "dhRefSth",
                     "dhRefImg2", "dhRefSth2", "dhCtlId", "dhCtlSth"):
            if key in extra:
                form_data[key] = str(extra[key])

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}{config['endpoint']}",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()
            if result.get("status") != 200:
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")
            return result

    # ===== AI视频接口 =====

    # 视频功能映射（全部走 doGenVideo，通过 dhAiType 区分）
    VIDEO_TYPE_MAP = {
        "text2video":       {"dhAiType": "text2video"},        # 文生视频
        "image2video":      {"dhAiType": "image2video"},       # 图生视频
        "frames2video":     {"dhAiType": "frames2video"},      # 首尾帧
        "sora2video":       {"dhAiType": "sora2video"},        # Sora2视频
        "presenter":        {"dhAiType": "presenter"},         # 数字人口播
        "text2videoaudio":  {"dhAiType": "text2videoaudio"},   # 文生视频(音频版)
        "image2videoaudio": {"dhAiType": "image2videoaudio"},  # 图生视频(音频版)
    }

    async def create_video_task(
        self, video_type: str, prompt: str,
        image_url: Optional[str] = None, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        创建视频生成任务

        接口: POST /api/aiart/doGenVideo
        所有视频功能走同一端点，通过 dhAiType 区分。

        Args:
            video_type: 视频功能类型
            prompt: 视频描述
            image_url: 输入图片URL（图生视频/首尾帧/数字人等需要）
            params: 额外参数（dhDuration/dhMode/dhResolution 等）

        Returns:
            Dict: API响应（含 uuid）
        """
        config = self.VIDEO_TYPE_MAP.get(video_type)
        if not config:
            raise ValueError(f"未知的视频功能类型: {video_type}")

        extra = params or {}
        form_data: Dict[str, str] = {
            "dhAiType": config["dhAiType"],
            "dhPrompt": prompt,
            "dhDuration": str(extra.get("dhDuration", "5")),
            "dhMode": str(extra.get("dhMode", "pro")),
            "dhResolution": str(extra.get("dhResolution", "480p")),
        }

        if image_url:
            form_data["dhInputImg"] = image_url

        # 数字人口播需要音频路径
        if extra.get("dhVoicePath"):
            form_data["dhVoicePath"] = str(extra["dhVoicePath"])

        # Sora2/首尾帧等可选参数
        for key in ("dhSizeId", "dhEndImg"):
            if key in extra:
                form_data[key] = str(extra[key])

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/aiart/doGenVideo",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()

            if result.get("status") != 200:
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")

            return result

    async def create_audio_task(
        self, prompt: str, voice_id: str,
        emotion: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        创建文生音频任务

        接口: POST /api/aiart/doGenVoice

        Args:
            prompt: 语音内容（最多300字）
            voice_id: 音色ID
            emotion: 情感标签（可选）

        Returns:
            Dict: API响应（含 uuid）
        """
        form_data: Dict[str, str] = {
            "dhAiType": "text2voice",
            "dhPrompt": prompt[:300],
            "dhVoiceId": voice_id,
        }
        if emotion:
            form_data["dhEmotion"] = emotion

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/aiart/doGenVoice",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()

            if result.get("status") != 200:
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")

            return result

    async def get_voice_list(self) -> Dict[str, Any]:
        """
        获取音色列表

        接口: GET /api/aiart/getVoiceList
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/api/aiart/getVoiceList",
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    # ===== 产品电商接口 =====

    # 一键生成类功能映射（走 doOneKeyGen 端点）
    ECOMMERCE_ONEKEY_MAP = {
        "white_bg":       {"dhAiType": "genecommerce"},      # 一键白底图
        "scene_bg":       {"dhAiType": "genproductscene"},    # 一键场景图
        "selling_point":  {"dhAiType": "sellingpoint"},       # 一键卖点图
        "detail_enhance": {"dhAiType": "detailenhance"},      # 一键细节特写
        "virtual_tryon":  {"dhAiType": "virtualtryon"},       # AI试穿试戴
    }

    # 商品图编辑类功能映射（走 doEdit 端点，复用已有 EDIT_TYPE_MAP 模式）
    ECOMMERCE_EDIT_MAP = {
        "product_rmbg":   {"dhSubAiType": "ps"},                                    # 抠图换背景
        "product_clear":  {"dhSubAiType": "photoclear", "dhRefMode": "2"},          # 变清晰
        "product_refine": {"dhSubAiType": "imgrefined", "dhRefMode": "1"},          # 产品精修
        "product_upscale":{"dhSubAiType": "upscale", "dhAiSubType": "upscale4k", "dhMode": "1"},  # 高清放大
        "product_changebg":{"dhSubAiType": "changebg", "dhMode": "1", "dhImgNum": "2"},  # AI换背景
        "product_sketch": {"dhSubAiType": "tosketch"},                               # 线稿提取
        "product_smartedit":{"dhSubAiType": "universaledit"},                        # 智能改图
        "product_whitebg":{"dhSubAiType": "whitebg"},                                # 电商白底图
        "product_premium":{"dhSubAiType": "imgrefined", "dhRefMode": "2"},           # 一键高级感
        "product_recolor":{"dhSubAiType": "changestyle"},                            # 换色换材质
        "product_translate":{"dhSubAiType": "imgtranslate"},                         # 图片翻译
    }

    async def create_ecommerce_task(
        self, ecommerce_type: str, image_url: str,
        prompt: Optional[str] = None, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        创建产品电商任务

        根据 ecommerce_type 选择 doOneKeyGen 或 doEdit 端点。

        Args:
            ecommerce_type: 电商功能类型
            image_url: 产品图URL
            prompt: 自定义描述（可选）
            params: 额外参数

        Returns:
            Dict: API响应（含 uuid）
        """
        extra = params or {}

        # 走 doEdit 端点的编辑类功能
        if ecommerce_type in self.ECOMMERCE_EDIT_MAP:
            type_params = dict(self.ECOMMERCE_EDIT_MAP[ecommerce_type])
            type_params.update({k: str(v) for k, v in extra.items() if k.startswith("dh")})
            return await self.create_edit_task(image_url, ecommerce_type, type_params)

        # AI产品设计（专用端点）
        if ecommerce_type == "product_design":
            form_data: Dict[str, str] = {
                "dhAiType": "producttextimage",
                "dhPrompt": prompt or "",
            }
            if image_url:
                form_data["dhInputImg"] = image_url
            for k, v in extra.items():
                if k.startswith("dh") and k not in form_data:
                    form_data[k] = str(v)

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/aiart/doGengoodsdesign",
                    headers=self._get_headers(),
                    data=form_data,
                )
                response.raise_for_status()
                result = response.json()
                if result.get("status") != 200:
                    raise ValueError(f"API错误: {result.get('msg', '未知错误')}")
                return result

        # 走 doOneKeyGen 端点的一键生成类功能
        config = self.ECOMMERCE_ONEKEY_MAP.get(ecommerce_type)
        if not config:
            raise ValueError(f"未知的电商功能类型: {ecommerce_type}")

        # doOneKeyGen 使用 dhInputImgs（JSON数组字符串）
        import json
        form_data = {
            "dhAiType": config["dhAiType"],
            "dhInputImgs": json.dumps([image_url]),
            "dhImgSize": str(extra.get("dhImgSize", "-1")),
            "dhImgNum": str(extra.get("dhImgNum", "1")),
            "dhDesignMode": str(extra.get("dhDesignMode", "strict")),
        }
        if prompt:
            form_data["dhPrompt"] = prompt
        # 可选参数
        for key in ("dhResolution", "dhDetails", "dhRefImg", "dhRefOptions"):
            if key in extra:
                form_data[key] = str(extra[key])

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/aiart/doOneKeyGen",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()

            if result.get("status") != 200:
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")

            return result

    # ===== 人像写真接口 =====

    # 人像写真功能映射表
    # 分两类：专用端点（换脸/修复/证件照/写真）和 doEdit 端点（变清晰/上色/换发型/转漫画）
    PORTRAIT_ENDPOINT_MAP = {
        "face_swap":       {"endpoint": "/api/aiart/doGenswapface",   "dhAiType": "swapface",    "needs_face": True},
        "old_photo_repair":{"endpoint": "/api/aiart/doGenfixphoto",   "dhAiType": "fixphoto",    "needs_face": False},
        "id_photo":        {"endpoint": "/api/aiart/doGenidphoto",    "dhAiType": "idphoto",     "needs_face": True},
        "ai_portrait":     {"endpoint": "/api/aiart/doGenaiportrait", "dhAiType": "aiportrait",  "needs_face": True},
    }

    # 走 doEdit 的人像功能
    PORTRAIT_EDIT_MAP = {
        "portrait_hd":     {"dhSubAiType": "photoclear",  "dhRefMode": "2"},   # 人像变清晰
        "colorize":        {"dhSubAiType": "colorize"},                          # 照片上色
        "hair_change":     {"dhSubAiType": "changehair"},                        # AI换发型
        "people2cartoon":  {"dhSubAiType": "people2cartoon"},                    # 真人转漫画
    }

    async def create_portrait_task(
        self, portrait_type: str, image_url: str,
        face_url: Optional[str] = None, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        创建人像写真任务

        根据 portrait_type 自动选择专用端点或 doEdit 端点。

        Args:
            portrait_type: 人像功能类型（face_swap/old_photo_repair/id_photo 等）
            image_url: 主图URL
            face_url: 人脸参考图URL（换脸/证件照/写真需要）
            params: 额外参数（如老照片修复的 blurLevel）

        Returns:
            Dict: API响应（含 uuid）
        """
        extra = params or {}

        # 走 doEdit 端点的功能
        if portrait_type in self.PORTRAIT_EDIT_MAP:
            type_params = dict(self.PORTRAIT_EDIT_MAP[portrait_type])
            type_params.update({k: str(v) for k, v in extra.items() if k.startswith("dh")})
            return await self.create_edit_task(image_url, portrait_type, type_params)

        # 走专用端点的功能
        config = self.PORTRAIT_ENDPOINT_MAP.get(portrait_type)
        if not config:
            raise ValueError(f"未知的人像功能类型: {portrait_type}")

        form_data: Dict[str, str] = {
            "dhAiType": config["dhAiType"],
            "dhInputImg": image_url,
        }

        # 需要人脸图的功能
        if config.get("needs_face"):
            if not face_url:
                raise ValueError(f"功能 {portrait_type} 需要提供人脸参考图")
            # AI写真用 dhRefImg + dhFaceImg，其他用 dhInputImg + dhFaceImg
            if portrait_type == "ai_portrait":
                form_data["dhRefImg"] = image_url
                form_data["dhFaceImg"] = face_url
                form_data["dhImgNum"] = str(extra.get("dhImgNum", "1"))
            else:
                form_data["dhFaceImg"] = face_url

        # 老照片修复的破损程度参数
        if portrait_type == "old_photo_repair":
            form_data["blurLevel"] = str(extra.get("blurLevel", "1"))

        # 合并额外 dh 参数
        for k, v in extra.items():
            if k.startswith("dh") and k not in form_data:
                form_data[k] = str(v)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}{config['endpoint']}",
                headers=self._get_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()

            # 专用端点返回格式：{status: 200, uuid: "...", imgs: {...}}
            if result.get("status") != 200:
                raise ValueError(f"API错误: {result.get('msg', '未知错误')}")

            return result

    # ===== 公共查询接口 =====

    async def get_model_list(self, aitype: str = "") -> Dict[str, Any]:
        """
        获取模型列表

        接口: GET /api/index/getapimodel
        参数: aitype — 创作类型（可选）
        """
        params = {}
        if aitype:
            params["aitype"] = aitype
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/api/index/getapimodel",
                headers=self._get_headers(),
                params=params,
            )
            response.raise_for_status()
            return response.json()

    async def get_style_list(self) -> Dict[str, Any]:
        """
        获取画风列表

        接口: GET /api/index/getapistyle
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/api/index/getapistyle",
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def get_category_list(self, pid: str = "0") -> Dict[str, Any]:
        """
        获取分类列表

        接口: GET /api/index/getCate
        参数: pid — 父级ID
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/api/index/getCate",
                headers=self._get_headers(),
                params={"pid": pid},
            )
            response.raise_for_status()
            return response.json()

    async def get_lora_list(self, aitype: str = "") -> Dict[str, Any]:
        """
        获取Lora主题模板列表

        接口: GET /api/lora/getLoraList
        参数: aitype — 创作类型（可选）
        """
        params = {}
        if aitype:
            params["aitype"] = aitype
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/api/lora/getLoraList",
                headers=self._get_headers(),
                params=params,
            )
            response.raise_for_status()
            return response.json()

    async def get_controlnet_list(self, aitype: str = "") -> Dict[str, Any]:
        """
        获取ControlNet列表

        接口: GET /api/index/getapicontrolnet
        参数: aitype — 创作类型（可选）
        """
        params = {}
        if aitype:
            params["aitype"] = aitype
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/api/index/getapicontrolnet",
                headers=self._get_headers(),
                params=params,
            )
            response.raise_for_status()
            return response.json()

    async def get_image_sizes(self, aitype: str = "") -> Dict[str, Any]:
        """
        获取AI创作出图尺寸列表

        接口: GET /api/index/getapiimgsize
        参数: aitype — 创作类型（可选）
        """
        params = {}
        if aitype:
            params["aitype"] = aitype
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/api/index/getapiimgsize",
                headers=self._get_headers(),
                params=params,
            )
            response.raise_for_status()
            return response.json()

    async def get_account_balance(self) -> Dict[str, Any]:
        """
        获取API账户积分余额

        接口: POST /api/aiart/getapiaccount
        返回: {"code": 200, "data": {"balance": 83520}, "msg": "success"}
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/aiart/getapiaccount",
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

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
