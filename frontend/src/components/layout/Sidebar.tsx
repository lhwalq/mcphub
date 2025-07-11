import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import UserProfileMenu from '@/components/ui/UserProfileMenu';

interface SidebarProps {
  collapsed: boolean;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { t } = useTranslation();

  // Menu item configuration
  const menuItems: MenuItem[] = [
    {
      path: '/',
      label: t('nav.servers'),
      icon: <img src="/assets/mcp.svg" className="h-5 w-5" alt="servers" />,
    },
  ];

  return (
    <aside
      className="fixed left-0 top-0 w-[80px] h-screen flex flex-col border-r border-[#EEEEEE]"
      style={{
        background: 'linear-gradient(180deg, #EEF2FF 34%, rgba(255, 255, 255, 0) 100%)',
      }}
    >
      {/* Logo */}
      <div className="p-4 flex justify-center">
        <img src="/assets/logo.svg" alt="Logo" className="h-12 w-12" />
      </div>

      {/* Scrollable navigation area */}
      <div className="flex-grow">
        <nav className="p-3 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-center w-12 h-12 mx-auto rounded-full transition-colors duration-200
                ${isActive
                  ? 'bg-[#FFFFFF]'
                  : ''}`
              }
              end={item.path === '/'}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User profile menu fixed at the bottom */}
      <div className="p-4 mb-4">
        <UserProfileMenu collapsed={collapsed} />
      </div>
    </aside>
  );
};

export default Sidebar;