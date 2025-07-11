import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileMenuProps {
  collapsed?: boolean;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate menu position based on button position
  const updateMenuPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: buttonRect.top + buttonRect.height / 2,
        left: buttonRect.right + 8
      });
    }
  };

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      updateMenuPosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const menu = isOpen ? (
    <div 
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-100 w-[120px] z-[9999]"
      style={{
        top: menuPosition.top - 36,
        left: menuPosition.left - 32,
        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))'
      }}
    >
      <div
        onClick={handleLogoutClick}
        className="w-full py-2 text-sm text-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all duration-150 cursor-pointer rounded-lg"
      >
        {t('app.logout')}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#302DF0] font-semibold mx-auto hover:bg-gray-50 transition-colors duration-200"
      >
        A
      </button>
      {menu && createPortal(menu, document.body)}
    </>
  );
};

export default UserProfileMenu;
