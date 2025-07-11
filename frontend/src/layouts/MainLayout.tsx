import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Content from '@/components/layout/Content';

const MainLayout: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#F5F7FA]">
      <div className="flex h-full">
        {/* 侧边导航 */}
        <Sidebar collapsed={true} />
        
        {/* 主内容区域 */}
        <div className="flex-1 ml-[80px] relative overflow-auto">
          <Content>
            <Outlet />
          </Content>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;