'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

export default function Navigation() {
  useEffect(() => {
    // 移动端菜单切换功能
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
      });

      // 点击菜单项时关闭菜单
      const navLinks = document.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('active');
          navToggle.classList.remove('active');
        });
      });
    }

    return () => {
      if (navToggle && navMenu) {
        navToggle.removeEventListener('click', () => {});
      }
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <a href="/" className="logo-link">
            <div className="logo-container">
              <Image
                src="/images/logo.png"
                alt="Pixuli"
                width={40}
                height={40}
                className="logo"
              />
              <div className="logo-text-container">
                <span className="logo-text">Pixuli</span>
                <span className="logo-subtitle">智能图片管理</span>
              </div>
            </div>
          </a>
        </div>
        <ul className="nav-menu">
          <li className="nav-item">
            <a href="/" className="nav-link">
              首页
            </a>
          </li>
          <li className="nav-item">
            <a href="/tutorial" className="nav-link">
              使用教程
            </a>
          </li>
        </ul>
        <div className="nav-toggle">
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
}
