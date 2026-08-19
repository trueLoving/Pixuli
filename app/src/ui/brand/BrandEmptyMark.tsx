import React from 'react';

/** 与 Logo 同透视的空立方：格子空、顶面无青光。 */
export const BrandEmptyMark: React.FC<{
  className?: string;
  size?: number;
}> = ({ className, size = 96 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 64 64"
    aria-hidden
  >
    <path
      d="M32 10 L54 22 L32 34 L10 22 Z"
      fill="var(--pix-violet-soft, #EDE9FE)"
      stroke="var(--pix-lilac, #C4B5FD)"
      strokeWidth="1.25"
    />
    <path
      d="M10 22 L32 34 L32 56 L10 44 Z"
      fill="#DDD6FE"
      stroke="var(--pix-lilac, #C4B5FD)"
      strokeWidth="1.25"
    />
    <path
      d="M32 34 L54 22 L54 44 L32 56 Z"
      fill="var(--pix-surface, #FAF8FF)"
      stroke="var(--pix-lilac, #C4B5FD)"
      strokeWidth="1.25"
      strokeDasharray="2.5 2"
    />
  </svg>
);
