// VersionInfoModal 组件公共类型定义

export interface VersionInfoModalProps {
  visible: boolean;
  onClose: () => void;
  t: (key: string) => string;
  colorScheme?: 'light' | 'dark';
}
