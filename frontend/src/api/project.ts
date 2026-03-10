/**
 * 项目相关 API
 */
import request from './request';

// 文生图请求
export interface Text2ImgRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance_scale?: number;
  num_images?: number;
  seed?: number;
  style?: string;
}

// 图生图请求
export interface Img2ImgRequest {
  image_url: string;
  prompt: string;
  negative_prompt?: string;
  strength?: number;
  steps?: number;
  guidance_scale?: number;
  seed?: number;
}

// 图片编辑请求
export interface ImageEditRequest {
  image_url: string;
  edit_type: string;
  params?: Record<string, any>;
}

// 3D渲染请求
export interface Render3DRequest {
  model_type: string;
  prompt: string;
  render_quality?: string;
}

// 项目响应
export interface ProjectResponse {
  id: number;
  uuid: string;
  type: string;
  sub_type?: string;
  status: string;
  progress: number;
  input_params: Record<string, any>;
  result_url?: string;
  result_urls?: string[];
  quota_cost: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// 项目列表响应
export interface ProjectListResponse {
  total: number;
  items: ProjectResponse[];
}

/**
 * 创建文生图任务
 */
export const createText2Img = (data: Text2ImgRequest): Promise<ProjectResponse> => {
  return request.post('/api/v1/projects/text2img', data);
};

/**
 * 创建图生图任务
 */
export const createImg2Img = (data: Img2ImgRequest): Promise<ProjectResponse> => {
  return request.post('/api/v1/projects/img2img', data);
};

/**
 * 创建图片编辑任务
 */
export const createImageEdit = (data: ImageEditRequest): Promise<ProjectResponse> => {
  return request.post('/api/v1/projects/edit', data);
};

/**
 * 创建3D渲染任务
 */
export const create3DRender = (data: Render3DRequest): Promise<ProjectResponse> => {
  return request.post('/api/v1/projects/3d_render', data);
};

/**
 * 获取项目列表
 */
export const getProjectList = (params?: {
  skip?: number;
  limit?: number;
  type?: string;
  status?: string;
}): Promise<ProjectListResponse> => {
  return request.get('/api/v1/projects/', { params });
};

/**
 * 获取项目详情
 */
export const getProjectDetail = (projectId: number): Promise<ProjectResponse> => {
  return request.get(`/api/v1/projects/${projectId}`);
};

/**
 * 删除项目
 */
export const deleteProject = (projectId: number): Promise<void> => {
  return request.delete(`/api/v1/projects/${projectId}`);
};

/**
 * 重试失败任务
 */
export const retryProject = (projectId: number): Promise<ProjectResponse> => {
  return request.post(`/api/v1/projects/${projectId}/retry`);
};
