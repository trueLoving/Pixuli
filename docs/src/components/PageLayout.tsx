'use client';

import Image from 'next/image';
import { useEffect } from 'react';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: string;
  gradient?: string;
}

export default function PageLayout({
  title,
  subtitle,
  children,
  icon,
  gradient = 'from-blue-500 to-purple-600',
}: PageLayoutProps) {
  useEffect(() => {
    // 平滑滚动
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const targetId = link.getAttribute('href')?.substring(1);
        const targetElement = document.getElementById(targetId || '');
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      });
    });

    // 滚动动画
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const animateElements = document.querySelectorAll(
      '.feature-card, .download-card, .tech-item, .content-card'
    );
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
      <section className="page-hero">
        <div className="page-hero-bg-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
          <div className="hero-orbs">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
          </div>
        </div>
        <div className="container">
          <div className="page-hero-content">
            <div className="page-hero-text">
              {icon && (
                <div className="page-hero-icon">
                  <i className={icon}></i>
                </div>
              )}
              <h1 className="page-hero-title">
                {title}
                <span className="gradient-text">体验</span>
              </h1>
              {subtitle && <p className="page-hero-description">{subtitle}</p>}
            </div>
            <div className="page-hero-image">
              <div className="page-preview">
                <Image
                  src="/images/app-preview.png"
                  alt={`${title} 预览`}
                  width={400}
                  height={300}
                  className="preview-image"
                />
                <div className="floating-elements">
                  <div className="floating-card card-1">
                    <i className="fas fa-star"></i>
                    <span>功能丰富</span>
                  </div>
                  <div className="floating-card card-2">
                    <i className="fas fa-rocket"></i>
                    <span>高效便捷</span>
                  </div>
                  <div className="floating-card card-3">
                    <i className="fas fa-heart"></i>
                    <span>用户喜爱</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="page-content">
        <div className="container">
          <div className="content-wrapper">{children}</div>
        </div>
      </section>
    </>
  );
}
