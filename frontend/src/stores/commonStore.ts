/**
 * 公共数据状态管理 Store
 * 管理模型、画风、分类、Lora、ControlNet、尺寸等公共数据的加载和缓存
 */
import { create } from 'zustand';
import type { ModelItem, StyleItem, CategoryItem, LoraItem, ControlNetItem, SizeItem } from '../api/common';
import { getModelList, getStyleList, getCategoryList, getLoraList, getControlNetList, getSizeList } from '../api/common';

interface CommonState {
  // 数据
  models: ModelItem[];
  styles: StyleItem[];
  categories: CategoryItem[];
  loras: LoraItem[];
  controlnets: ControlNetItem[];
  sizes: SizeItem[];

  // 加载状态
  modelsLoading: boolean;
  stylesLoading: boolean;
  sizesLoading: boolean;

  // 操作
  fetchModels: (aitype?: string) => Promise<void>;
  fetchStyles: () => Promise<void>;
  fetchCategories: (pid?: string) => Promise<void>;
  fetchLoras: (aitype?: string) => Promise<void>;
  fetchControlNets: (aitype?: string) => Promise<void>;
  fetchSizes: (aitype?: string) => Promise<void>;
}

export const useCommonStore = create<CommonState>()((set) => ({
  // 初始状态
  models: [],
  styles: [],
  categories: [],
  loras: [],
  controlnets: [],
  sizes: [],
  modelsLoading: false,
  stylesLoading: false,
  sizesLoading: false,

  /** 加载模型列表 */
  fetchModels: async (aitype?: string) => {
    set({ modelsLoading: true });
    try {
      const res = await getModelList(aitype);
      set({ models: res.data || [] });
    } catch {
      console.error('加载模型列表失败');
    } finally {
      set({ modelsLoading: false });
    }
  },

  /** 加载画风列表 */
  fetchStyles: async () => {
    set({ stylesLoading: true });
    try {
      const res = await getStyleList();
      set({ styles: res.data || [] });
    } catch {
      console.error('加载画风列表失败');
    } finally {
      set({ stylesLoading: false });
    }
  },

  /** 加载分类列表 */
  fetchCategories: async (pid?: string) => {
    try {
      const res = await getCategoryList(pid);
      set({ categories: res.data || [] });
    } catch {
      console.error('加载分类列表失败');
    }
  },

  /** 加载Lora模板列表 */
  fetchLoras: async (aitype?: string) => {
    try {
      const res = await getLoraList(aitype);
      set({ loras: res.data || [] });
    } catch {
      console.error('加载Lora列表失败');
    }
  },

  /** 加载ControlNet列表 */
  fetchControlNets: async (aitype?: string) => {
    try {
      const res = await getControlNetList(aitype);
      set({ controlnets: res.data || [] });
    } catch {
      console.error('加载ControlNet列表失败');
    }
  },

  /** 加载出图尺寸列表 */
  fetchSizes: async (aitype?: string) => {
    set({ sizesLoading: true });
    try {
      const res = await getSizeList(aitype);
      set({ sizes: res.data || [] });
    } catch {
      console.error('加载尺寸列表失败');
    } finally {
      set({ sizesLoading: false });
    }
  },
}));
