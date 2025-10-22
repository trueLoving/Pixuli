export interface ImageItem {
  id: string;
  name: string;
  url: string;
  githubUrl: string;
  size: number;
  width: number;
  height: number;
  type: string;
  tags: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageUploadData {
  file: File;
  name?: string;
  description?: string;
  tags?: string[];
}

export interface ImageEditData {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
}

export interface UploadProgress {
  id: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  message?: string;
}

export interface MultiImageUploadData {
  files: File[];
  name?: string;
  description?: string;
  tags?: string[];
}

export interface BatchUploadProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  items: UploadProgress[];
}
