/** 播放模式 */
export type PlayMode = 'sequential' | 'random' | 'loop';

/** 过渡效果类型 */
export type TransitionEffect =
  | 'fade'
  | 'slide'
  | 'zoom'
  | 'blur'
  | 'rotate'
  | 'none';

/** 幻灯片配置 */
export interface SlideShowConfig {
  /** 播放间隔（毫秒） */
  interval: number;
  /** 播放模式 */
  playMode: PlayMode;
  /** 是否自动播放 */
  autoPlay: boolean;
  /** 是否循环播放 */
  loop: boolean;
  /** 过渡效果 */
  transitionEffect: TransitionEffect;
  /** 过渡持续时间（毫秒） */
  transitionDuration: number;
  /** 背景音乐文件路径 */
  backgroundMusic?: string;
  /** 背景音乐音量（0-1） */
  musicVolume: number;
  /** 是否显示图片信息 */
  showImageInfo: boolean;
  /** 是否全屏播放 */
  fullscreen: boolean;
}

/** 默认配置 */
export const DEFAULT_SLIDE_SHOW_CONFIG: SlideShowConfig = {
  interval: 3000,
  playMode: 'sequential',
  autoPlay: false,
  loop: true,
  transitionEffect: 'fade',
  transitionDuration: 500,
  musicVolume: 0.5,
  showImageInfo: true,
  fullscreen: false,
};

/** 幻灯片播放器状态 */
export interface SlideShowPlayerState {
  /** 当前图片索引 */
  currentIndex: number;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 是否暂停 */
  isPaused: boolean;
  /** 背景音乐是否播放 */
  isMusicPlaying: boolean;
  /** 是否全屏 */
  isFullscreen: boolean;
}
