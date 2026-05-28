export interface ImageMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  title?: string;
  metadata: {
    size: number; // 文件大小（字节）
    width?: number; // 图片宽度（像素）
    height?: number; // 图片高度（像素）
    description?: string; // 图片描述
    tags?: string[]; // 标签数组
    [key: string]: any; // 其他扩展字段
  };
  uploadDate: Date;
  url: string;
  path: string;
}
