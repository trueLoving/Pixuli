import type { MDXComponents } from 'mdx/types';
import { ReactNode } from 'react';

// 自定义MDX组件样式
const components: MDXComponents = {
  // 标题样式 - 增强版
  h1: ({ children }: { children: ReactNode }) => (
    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 mt-8 first:mt-0 border-b-2 border-blue-500 pb-3 relative">
      <span className="absolute -left-2 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></span>
      {children}
    </h1>
  ),
  h2: ({ children }: { children: ReactNode }) => (
    <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-5 mt-7 border-l-4 border-blue-500 pl-4 bg-gradient-to-r from-blue-50 to-transparent py-2 rounded-r-lg">
      {children}
    </h2>
  ),
  h3: ({ children }: { children: ReactNode }) => (
    <h3 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 mt-6 relative pl-3">
      <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></span>
      {children}
    </h3>
  ),
  h4: ({ children }: { children: ReactNode }) => (
    <h4 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3 mt-5 text-blue-700">
      {children}
    </h4>
  ),
  h5: ({ children }: { children: ReactNode }) => (
    <h5 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 mt-4 text-blue-600">
      {children}
    </h5>
  ),
  h6: ({ children }: { children: ReactNode }) => (
    <h6 className="text-base md:text-lg font-semibold text-gray-800 mb-2 mt-4 text-blue-500">
      {children}
    </h6>
  ),
  
  // 段落样式 - 增强版
  p: ({ children }: { children: ReactNode }) => (
    <p className="text-gray-700 mb-4 leading-relaxed text-base md:text-lg">
      {children}
    </p>
  ),
  
  // 列表样式 - 增强版
  ul: ({ children }: { children: ReactNode }) => (
    <ul className="list-none mb-6 space-y-3 text-gray-700">
      {children}
    </ul>
  ),
  ol: ({ children }: { children: ReactNode }) => (
    <ol className="list-none mb-6 space-y-3 text-gray-700 counter-reset: list-counter">
      {children}
    </ol>
  ),
  li: ({ children }: { children: ReactNode }) => (
    <li className="relative pl-8 before:content-['•'] before:absolute before:left-0 before:top-0 before:text-blue-500 before:font-bold before:text-xl">
      <div className="text-gray-700 leading-relaxed">
        {children}
      </div>
    </li>
  ),
  
  // 代码块样式 - 增强版
  code: ({ children, className }: { children: ReactNode; className?: string }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm font-mono border border-gray-200">
          {children}
        </code>
      );
    }
    return (
      <code className={className}>
        {children}
      </code>
    );
  },
  pre: ({ children }: { children: ReactNode }) => (
    <div className="relative mb-6">
      <div className="absolute top-3 left-4 flex space-x-2">
        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-6 pt-12 rounded-lg overflow-x-auto border border-gray-700 shadow-lg">
        {children}
      </pre>
    </div>
  ),
  
  // 引用块样式 - 增强版
  blockquote: ({ children }: { children: ReactNode }) => (
    <blockquote className="border-l-4 border-blue-500 pl-6 py-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700 italic rounded-r-lg shadow-sm relative">
      <div className="absolute top-4 left-2 text-blue-400 text-2xl font-bold">"</div>
      <div className="pl-4">
        {children}
      </div>
    </blockquote>
  ),
  
  // 表格样式 - 增强版
  table: ({ children }: { children: ReactNode }) => (
    <div className="overflow-x-auto mb-8 shadow-lg rounded-lg border border-gray-200">
      <table className="min-w-full border-collapse bg-white">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children: ReactNode }) => (
    <thead className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      {children}
    </thead>
  ),
  tbody: ({ children }: { children: ReactNode }) => (
    <tbody className="divide-y divide-gray-200">
      {children}
    </tbody>
  ),
  tr: ({ children }: { children: ReactNode }) => (
    <tr className="hover:bg-gray-50 transition-colors duration-200">
      {children}
    </tr>
  ),
  th: ({ children }: { children: ReactNode }) => (
    <th className="px-6 py-4 text-left font-semibold text-white text-sm uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }: { children: ReactNode }) => (
    <td className="px-6 py-4 text-gray-700 border-b border-gray-100">
      {children}
    </td>
  ),
  
  // 链接样式 - 增强版
  a: ({ href, children }: { href?: string; children: ReactNode }) => (
    <a 
      href={href} 
      className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 transition-all duration-200 hover:decoration-blue-400 font-medium"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  
  // 水平分割线 - 增强版
  hr: () => (
    <div className="my-12 flex items-center justify-center">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      <div className="mx-4 w-2 h-2 bg-blue-500 rounded-full"></div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
    </div>
  ),
  
  // 强调文本 - 增强版
  strong: ({ children }: { children: ReactNode }) => (
    <strong className="font-bold text-gray-900 bg-yellow-100 px-1 rounded">
      {children}
    </strong>
  ),
  em: ({ children }: { children: ReactNode }) => (
    <em className="italic text-gray-800 bg-blue-50 px-1 rounded">
      {children}
    </em>
  ),
  
  // 删除线文本
  del: ({ children }: { children: ReactNode }) => (
    <del className="line-through text-gray-500 bg-red-50 px-1 rounded">
      {children}
    </del>
  ),
  
  // 标记文本
  mark: ({ children }: { children: ReactNode }) => (
    <mark className="bg-yellow-200 text-gray-900 px-1 rounded">
      {children}
    </mark>
  ),
  
  // 键盘按键样式
  kbd: ({ children }: { children: ReactNode }) => (
    <kbd className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm font-mono shadow-sm">
      {children}
    </kbd>
  ),
  
  // 图片样式
  img: ({ src, alt, ...props }: { src?: string; alt?: string; [key: string]: any }) => (
    <div className="my-8 text-center">
      <img 
        src={src} 
        alt={alt} 
        className="max-w-full h-auto rounded-lg shadow-lg border border-gray-200 mx-auto"
        {...props}
      />
      {alt && (
        <p className="text-sm text-gray-500 mt-2 italic">
          {alt}
        </p>
      )}
    </div>
  ),
  
  // 详情和摘要样式
  details: ({ children }: { children: ReactNode }) => (
    <details className="mb-6 border border-gray-200 rounded-lg shadow-sm">
      {children}
    </details>
  ),
  summary: ({ children }: { children: ReactNode }) => (
    <summary className="px-4 py-3 bg-gray-50 cursor-pointer font-semibold text-gray-800 hover:bg-gray-100 transition-colors duration-200 rounded-t-lg">
      {children}
    </summary>
  ),
  
  // 脚注样式
  sup: ({ children }: { children: ReactNode }) => (
    <sup className="text-blue-600 font-medium text-xs">
      {children}
    </sup>
  ),
  
  // 下标样式
  sub: ({ children }: { children: ReactNode }) => (
    <sub className="text-gray-600 font-medium text-xs">
      {children}
    </sub>
  ),
  
  // 小文本样式
  small: ({ children }: { children: ReactNode }) => (
    <small className="text-sm text-gray-500">
      {children}
    </small>
  ),
  
  // 大文本样式
  big: ({ children }: { children: ReactNode }) => (
    <big className="text-lg text-gray-800">
      {children}
    </big>
  ),
  
  // 地址样式
  address: ({ children }: { children: ReactNode }) => (
    <address className="not-italic text-gray-600 border-l-2 border-gray-300 pl-4 py-2 bg-gray-50 rounded-r">
      {children}
    </address>
  ),
  
  // 时间样式
  time: ({ children }: { children: ReactNode }) => (
    <time className="text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
      {children}
    </time>
  ),
  
  // 进度条样式
  progress: ({ value, max }: { value?: number; max?: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${((value || 0) / (max || 100)) * 100}%` }}
      ></div>
    </div>
  ),
  
  // 计量器样式
  meter: ({ value, min, max }: { value?: number; min?: number; max?: number }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{min || 0}</span>
        <span className="font-semibold">{value || 0}</span>
        <span>{max || 100}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
          style={{ width: `${((value || 0) / (max || 100)) * 100}%` }}
        ></div>
      </div>
    </div>
  ),
} satisfies MDXComponents;

// 导出 useMDXComponents 函数
export function useMDXComponents(): MDXComponents {
  return components
}