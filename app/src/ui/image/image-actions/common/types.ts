export type ImageActionId =
  | 'preview'
  | 'edit'
  | 'viewUrl'
  | 'copyUrl'
  | 'openUrl'
  | 'share'
  | 'delete';

export type ImageActionMenuVariant = 'icon-bar' | 'labeled-bar' | 'dropdown';

export type ImageActionHandlers = Partial<
  Record<ImageActionId, () => void | Promise<void>>
>;

export interface ImageActionMenuProps {
  variant: ImageActionMenuVariant;
  /** 要展示的操作（顺序即展示顺序） */
  actions: ImageActionId[];
  handlers: ImageActionHandlers;
  t: (key: string) => string;
  className?: string;
  /** dropdown：受控展开 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface ImageContextMenuState {
  x: number;
  y: number;
  actions: ImageActionId[];
  handlers: ImageActionHandlers;
}
