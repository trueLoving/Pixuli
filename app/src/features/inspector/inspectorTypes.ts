import type { LucideIcon } from 'lucide-react';

export interface CompactAction {
  id: string;
  label: string;
  title?: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

export interface MetadataReviewSession {
  ids: string[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onDone: () => void;
  /** 变化时自动打开编辑弹层 */
  openEditNonce: number;
}
