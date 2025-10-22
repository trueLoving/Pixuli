import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  metadataBase: new URL('https://pixuli.app'),
  title: 'Pixuli - 智能图片管理应用',
  description:
    'Pixuli 是一款现代化的跨平台图片管理桌面应用，提供智能图片分析、自动标签生成、批量处理等功能。',
  keywords: '图片管理,AI图片分析,桌面应用,Electron,智能标签',
  openGraph: {
    type: 'website',
    url: 'https://pixuli-docs.vercel.app/',
    title: 'Pixuli - 智能图片管理应用',
    description: '现代化的跨平台图片管理桌面应用，AI驱动的智能图片分析和管理',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pixuli 应用预览',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pixuli - 智能图片管理应用',
    description: '现代化的跨平台图片管理桌面应用，AI驱动的智能图片分析和管理',
    images: ['/images/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="antialiased">
        <Navigation />
        {children}
      </body>
    </html>
  );
}
