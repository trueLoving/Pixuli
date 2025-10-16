// 移动端类型定义
export interface ImageItem {
  id: string;
  name: string;
  url: string;
  size: number;
  width: number;
  height: number;
  format: string;
  createdAt: string;
  tags?: string[];
  description?: string;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

export interface AppState {
  images: ImageItem[];
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
}
