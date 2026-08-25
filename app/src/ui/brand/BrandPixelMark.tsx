import React from 'react';
import './BrandPixelMark.css';

export type BrandPixelVariant =
  | 'empty'
  | 'filter'
  | 'loading'
  | 'welcome'
  | 'offline';

export interface BrandPixelMarkProps {
  variant?: BrandPixelVariant;
  className?: string;
  size?: number;
}

/**
 * Logo 同透视像素立方：空态 / 筛选 / 加载 / 欢迎底座 / 未连接。
 * @see docs/01-product/05-brand-visual-ui.md §四 §五
 */
export const BrandPixelMark: React.FC<BrandPixelMarkProps> = ({
  variant = 'empty',
  className,
  size = 96,
}) => {
  const showGlow = variant === 'loading';
  const showPedestal = variant === 'welcome';
  const showFilter = variant === 'filter';

  return (
    <span
      className={`brand-pixel-mark brand-pixel-mark--${variant}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        className="brand-pixel-mark__svg"
        width={size}
        height={size}
        viewBox="0 0 64 72"
        focusable="false"
      >
        {showPedestal ? (
          <ellipse
            className="brand-pixel-mark__pedestal"
            cx="32"
            cy="66"
            rx="22"
            ry="4"
            fill="none"
            stroke="var(--pix-lilac, #C4B5FD)"
            strokeWidth="1.25"
            strokeDasharray="3 2.5"
          />
        ) : null}

        {/* 顶面 */}
        <path
          className={`brand-pixel-mark__top${showGlow ? ' brand-pixel-mark__top--glow' : ''}${variant === 'offline' ? ' brand-pixel-mark__top--offline' : ''}`}
          d="M32 8 L54 20 L32 32 L10 20 Z"
          fill={
            showGlow
              ? 'var(--pix-cyan, #5EE1F7)'
              : variant === 'offline'
                ? '#C4B5FD'
                : 'var(--pix-violet-soft, #EDE9FE)'
          }
          stroke="var(--pix-lilac, #C4B5FD)"
          strokeWidth="1.25"
          opacity={variant === 'offline' ? 0.55 : 1}
        />

        {/* 左面：目录线（空） */}
        <path
          d="M10 20 L32 32 L32 56 L10 44 Z"
          fill="#DDD6FE"
          stroke="var(--pix-lilac, #C4B5FD)"
          strokeWidth="1.25"
        />
        <path
          d="M14 28 H26 M14 34 H24 M14 40 H22"
          fill="none"
          stroke="var(--pix-lilac, #C4B5FD)"
          strokeWidth="1"
          strokeLinecap="square"
          opacity={variant === 'offline' ? 0.35 : 0.55}
        />

        {/* 右面：2×3 空格子 */}
        <path
          d="M32 32 L54 20 L54 44 L32 56 Z"
          fill="var(--pix-surface, #FAF8FF)"
          stroke="var(--pix-lilac, #C4B5FD)"
          strokeWidth="1.25"
        />
        <g
          className={
            showFilter
              ? 'brand-pixel-mark__grid brand-pixel-mark__grid--faded'
              : 'brand-pixel-mark__grid'
          }
          fill="none"
          stroke="var(--pix-lilac, #C4B5FD)"
          strokeWidth="1"
        >
          {/* 上排 */}
          <path d="M36 30 L43 26 L43 32 L36 36 Z" />
          <path d="M44 25.5 L51 21.5 L51 27.5 L44 31.5 Z" />
          {/* 中排 */}
          <path d="M36 37 L43 33 L43 39 L36 43 Z" />
          <path d="M44 32.5 L51 28.5 L51 34.5 L44 38.5 Z" />
          {/* 下排 */}
          <path d="M36 44 L43 40 L43 46 L36 50 Z" />
          <path d="M44 39.5 L51 35.5 L51 41.5 L44 45.5 Z" />
        </g>

        {showFilter ? (
          <g className="brand-pixel-mark__glass" transform="translate(40 34)">
            <rect
              x="0"
              y="0"
              width="10"
              height="10"
              rx="1"
              fill="var(--pix-violet-soft, #EDE9FE)"
              stroke="var(--pix-violet, #7C6CF0)"
              strokeWidth="1.25"
            />
            <rect
              x="2.5"
              y="2.5"
              width="5"
              height="5"
              fill="none"
              stroke="var(--pix-violet, #7C6CF0)"
              strokeWidth="1.25"
            />
            <path
              d="M9 9 L13 13"
              stroke="var(--pix-violet, #7C6CF0)"
              strokeWidth="1.75"
              strokeLinecap="square"
            />
          </g>
        ) : null}

        {showGlow ? (
          <g className="brand-pixel-mark__pixels" aria-hidden>
            <rect
              className="brand-pixel-mark__pixel brand-pixel-mark__pixel--1"
              x="28"
              y="2"
              width="4"
              height="4"
              rx="0.5"
            />
            <rect
              className="brand-pixel-mark__pixel brand-pixel-mark__pixel--2"
              x="36"
              y="0"
              width="4"
              height="4"
              rx="0.5"
            />
            <rect
              className="brand-pixel-mark__pixel brand-pixel-mark__pixel--3"
              x="22"
              y="4"
              width="4"
              height="4"
              rx="0.5"
            />
            <rect
              className="brand-pixel-mark__pixel brand-pixel-mark__pixel--4"
              x="42"
              y="3"
              width="4"
              height="4"
              rx="0.5"
            />
            <rect
              className="brand-pixel-mark__pixel brand-pixel-mark__pixel--5"
              x="32"
              y="-2"
              width="4"
              height="4"
              rx="0.5"
            />
          </g>
        ) : null}
      </svg>
    </span>
  );
};

/** @deprecated 使用 BrandPixelMark variant="empty" */
export const BrandEmptyMark: React.FC<{
  className?: string;
  size?: number;
}> = ({ className, size = 96 }) => (
  <BrandPixelMark variant="empty" className={className} size={size} />
);

export default BrandPixelMark;
