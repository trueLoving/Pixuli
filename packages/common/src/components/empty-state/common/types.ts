// EmptyState 组件公共类型定义

export interface EmptyStateProps {
  onAddGitHub: () => void;
  onAddGitee: () => void;
  onTryDemo?: () => void;
  t?: (key: string) => string;
}
