/**
 * 公共数据查询 API
 * 提供模型、画风、分类、Lora、ControlNet、尺寸、账户余额等公共数据接口
 */
import request from './request';

// 模型项
export interface ModelItem {
  id: number;
  name: string;
  img: string;
}

// 画风项
export interface StyleItem {
  id: number;
  name: string;
  img?: string;
}

// 分类项
export interface CategoryItem {
  id: number;
  name: string;
  pid?: number;
}

// Lora模板项
export interface LoraItem {
  id: number;
  name: string;
  img?: string;
}

// ControlNet项
export interface ControlNetItem {
  id: number;
  name: string;
  img?: string;
}

// 尺寸项
export interface SizeItem {
  id: number;
  name: string;
  width?: number;
  height?: number;
}

// 通用列表响应格式
interface ListResponse<T> {
  status: number;
  data: T[];
  msg: string;
}

// 账户余额响应
interface BalanceResponse {
  code: number;
  data: { balance: number };
  msg: string;
}

/** 获取模型列表 */
export const getModelList = (aitype?: string): Promise<ListResponse<ModelItem>> => {
  return request.get('/api/v1/common/models', { params: { aitype: aitype || '' } });
};

/** 获取画风列表 */
export const getStyleList = (): Promise<ListResponse<StyleItem>> => {
  return request.get('/api/v1/common/styles');
};

/** 获取分类列表 */
export const getCategoryList = (pid?: string): Promise<ListResponse<CategoryItem>> => {
  return request.get('/api/v1/common/categories', { params: { pid: pid || '0' } });
};

/** 获取Lora模板列表 */
export const getLoraList = (aitype?: string): Promise<ListResponse<LoraItem>> => {
  return request.get('/api/v1/common/lora', { params: { aitype: aitype || '' } });
};

/** 获取ControlNet列表 */
export const getControlNetList = (aitype?: string): Promise<ListResponse<ControlNetItem>> => {
  return request.get('/api/v1/common/controlnet', { params: { aitype: aitype || '' } });
};

/** 获取出图尺寸列表 */
export const getSizeList = (aitype?: string): Promise<ListResponse<SizeItem>> => {
  return request.get('/api/v1/common/sizes', { params: { aitype: aitype || '' } });
};

// 音色项
export interface VoiceItem {
  id: string;
  name: string;
  emotion?: string;
  sample_url?: string;
}

/** 获取音色列表 */
export const getVoiceList = (): Promise<ListResponse<VoiceItem>> => {
  return request.get('/api/v1/common/voices');
};

/** 获取API账户积分余额 */
export const getAccountBalance = (): Promise<BalanceResponse> => {
  return request.get('/api/v1/common/account/balance');
};
