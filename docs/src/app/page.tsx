'use client';

import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // 平滑滚动
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href')?.substring(1);
        const targetElement = document.getElementById(targetId || '');
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // 滚动动画
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.feature-card, .download-card, .tech-item');
    animateElements.forEach(el => observer.observe(el));

    return () => {
      links.forEach(link => {
        link.removeEventListener('click', () => {});
      });
      animateElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-bg-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
          <div className="hero-orbs">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
          </div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              智能图片管理
              <span className="gradient-text">重新定义</span>
            </h1>
            <p className="hero-description">
              Pixuli 是一款现代化的跨平台图片管理桌面应用，基于 AI 技术提供智能图片分析、自动标签生成、批量处理等功能，让您的图片库管理变得简单高效。
            </p>
            <div className="hero-buttons">
              <a href="https://github.com/trueLoving/Pixuli/releases" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                <i className="fas fa-download"></i>
                立即下载
              </a>
              <a href="#features" className="btn btn-secondary">
                <i className="fas fa-play"></i>
                了解更多
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">用户下载</span>
              </div>
              <div className="stat">
                <span className="stat-number">99%</span>
                <span className="stat-label">用户满意度</span>
              </div>
              <div className="stat">
                <span className="stat-number">2</span>
                <span className="stat-label">平台支持</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="app-preview">
              <Image src="/images/app-preview.png" alt="Pixuli 应用预览" width={600} height={400} className="preview-image" />
              <div className="floating-elements">
                <div className="floating-card card-1">
                  <i className="fas fa-magic"></i>
                  <span>AI 智能分析</span>
                </div>
                <div className="floating-card card-2">
                  <i className="fas fa-tags"></i>
                  <span>自动标签</span>
                </div>
                <div className="floating-card card-3">
                  <i className="fas fa-cloud"></i>
                  <span>云端同步</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">强大的功能特色</h2>
            <p className="section-description">
              基于先进技术构建，为您提供最佳的图片管理体验
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-brain"></i>
              </div>
              <h3 className="feature-title">AI 智能分析</h3>
              <p className="feature-description">
                基于 TensorFlow.js 和 GGUF 模型，智能识别图片内容，自动生成描述和标签
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-tags"></i>
              </div>
              <h3 className="feature-title">自动标签系统</h3>
              <p className="feature-description">
                智能分析图片内容，自动生成相关标签，让图片分类变得简单高效
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-compress"></i>
              </div>
              <h3 className="feature-title">智能压缩</h3>
              <p className="feature-description">
                智能图片压缩算法，在保持质量的同时大幅减少文件大小
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-search"></i>
              </div>
              <h3 className="feature-title">智能搜索</h3>
              <p className="feature-description">
                基于 AI 的语义搜索，通过描述快速找到您需要的图片
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-cloud"></i>
              </div>
              <h3 className="feature-title">GitHub 集成</h3>
              <p className="feature-description">
                与 GitHub 深度集成，支持版本控制和团队协作
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3 className="feature-title">跨平台支持</h3>
              <p className="feature-description">
                支持 Windows 和 macOS，一次开发，多平台使用
              </p>
            </div>
            {/* <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-book"></i>
              </div>
              <h3 className="feature-title">详细文档</h3>
              <p className="feature-description">
                完整的使用教程和键盘功能说明，助您快速上手
              </p>
              <div className="feature-links">
                <a href="/tutorial" className="feature-link">使用教程</a>
                <a href="/keyboard" className="feature-link">键盘功能</a>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="download">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">立即下载 Pixuli</h2>
            <p className="section-description">
              选择您的平台，开始体验智能图片管理
            </p>
          </div>
          <div className="download-grid">
            <div className="download-card">
              <div className="platform-icon">
                <i className="fab fa-windows"></i>
              </div>
              <h3 className="platform-name">Windows</h3>
              <p className="platform-description">Windows 10/11 (64-bit)</p>
              <a href="https://github.com/trueLoving/Pixuli/releases" className="download-btn" target="_blank" rel="noopener noreferrer">
                <i className="fas fa-download"></i>
                下载 Windows 版
              </a>
            </div>
            <div className="download-card">
              <div className="platform-icon">
                <i className="fab fa-apple"></i>
              </div>
              <h3 className="platform-name">macOS</h3>
              <p className="platform-description">macOS 10.15 或更高版本</p>
              <a href="https://github.com/trueLoving/Pixuli/releases" className="download-btn" target="_blank" rel="noopener noreferrer">
                <i className="fas fa-download"></i>
                下载 macOS 版
              </a>
            </div>
          </div>
          <div className="download-info">
            <p className="version-info">当前版本: v1.1.0</p>
            <p className="release-notes">
              <a href="https://github.com/trueLoving/Pixuli/releases" className="release-link" target="_blank" rel="noopener noreferrer">查看更新日志</a>
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title">关于 Pixuli</h2>
              <p className="about-description">
                Pixuli 诞生于对高效图片管理的需求。我们相信，通过 AI 技术的力量，可以让图片管理变得更加智能和便捷。
              </p>
              <p className="about-description">
                基于 Electron + React + TypeScript 构建，Pixuli 不仅提供了现代化的用户界面，还集成了先进的 AI 技术，包括 TensorFlow.js 和 GGUF 模型支持，为您带来前所未有的图片管理体验。
              </p>
              <div className="tech-stack">
                <h3>技术栈</h3>
                <p className="tech-description">
                  基于现代化的技术栈构建，确保应用的高性能、可维护性和用户体验
                </p>
                <div className="tech-items">
                  <div className="tech-item">
                    <span className="tech-name">Electron</span>
                    <span className="tech-desc">跨平台桌面应用框架</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-name">React</span>
                    <span className="tech-desc">现代化用户界面库</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-name">TypeScript</span>
                    <span className="tech-desc">类型安全的JavaScript</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-name">TensorFlow.js</span>
                    <span className="tech-desc">浏览器端机器学习</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-name">Rust + WebAssembly</span>
                    <span className="tech-desc">高性能图像处理</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-name">Tailwind CSS</span>
                    <span className="tech-desc">实用优先的CSS框架</span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-name">Vite</span>
                    <span className="tech-desc">快速构建工具</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <Image src="/images/logo.png" alt="Pixuli" width={32} height={32} className="logo" />
                <span className="logo-text">Pixuli</span>
              </div>
              <p className="footer-description">
                智能图片管理，让每一张图片都有价值
              </p>
              <div className="social-links">
                <a href="https://github.com/trueLoving/pixuli" className="social-link">
                  <i className="fab fa-github"></i>
                </a>
                <a href="#" className="social-link">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="social-link">
                  <i className="fab fa-discord"></i>
                </a>
              </div>
            </div>
            <div className="footer-section">
              <h3 className="footer-title">产品</h3>
              <ul className="footer-links">
                <li><a href="#features">功能特色</a></li>
                <li><a href="https://github.com/trueLoving/Pixuli/releases" target="_blank" rel="noopener noreferrer">下载</a></li>
                <li><a href="https://github.com/trueLoving/Pixuli/releases" target="_blank" rel="noopener noreferrer">更新日志</a></li>
                <li><a href="#">路线图</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3 className="footer-title">支持</h3>
              <ul className="footer-links">
                <li><a href="#">帮助文档</a></li>
                <li><a href="#">常见问题</a></li>
                <li><a href="https://github.com/trueLoving/Pixuli/issues" target="_blank" rel="noopener noreferrer">问题反馈</a></li>
                <li><a href="#">联系我们</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3 className="footer-title">社区</h3>
              <ul className="footer-links">
                <li><a href="https://github.com/trueLoving/pixuli" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                <li><a href="#">贡献指南</a></li>
                <li><a href="#">开发者文档</a></li>
                <li><a href="#">API 文档</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="copyright">
              2024 Pixuli Team. 保留所有权利。
            </p>
            <div className="footer-legal">
              <a href="#">隐私政策</a>
              <a href="#">服务条款</a>
              <a href="#">开源许可</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}