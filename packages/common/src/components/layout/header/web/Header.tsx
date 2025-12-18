import React from 'react';
import './Header.css';

interface HeaderProps {
  /** 左侧操作区域插槽（用于添加自定义组件，如搜索框、筛选等） */
  leftActions?: React.ReactNode;
  /** 右侧操作区域插槽（用于添加自定义组件，如刷新按钮、语言切换、Demo 图标等） */
  rightActions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ leftActions, rightActions }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        {/* 左侧操作插槽（用于搜索框、筛选等自定义组件） */}
        {leftActions}
      </div>

      <div className="header-right">
        {/* 右侧操作插槽（用于刷新按钮、语言切换、Demo 图标等自定义组件） */}
        {rightActions}
      </div>
    </header>
  );
};

export default Header;
