import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, PenTool, MessageCircleHeart, CalendarDays, Sparkles, Users, CalendarClock, Menu, X, Sun, Moon, Key, BarChart3, Settings, AlertCircle, Download } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import ApiKeyModal from './ApiKeyModal';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/customers', icon: Users, label: 'Quản lý Khách hàng' },
  { to: '/appointments', icon: CalendarClock, label: 'Lịch hẹn & Tái khám' },
  { to: '/reports', icon: BarChart3, label: 'Báo cáo Doanh thu' },
  { to: '/settings', icon: Settings, label: 'Cài đặt & Sao lưu' },
  { to: '/post-generator', icon: PenTool, label: 'Viết bài Marketing' },
  { to: '/consultation', icon: MessageCircleHeart, label: 'Tư vấn Khách hàng' },
  { to: '/calendar', icon: CalendarDays, label: 'Lên kế hoạch Content' },
];

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [apiKey, setApiKey] = useState(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) return saved;
    return '';
  });
  const [apiModel, setApiModel] = useState(() => {
    return localStorage.getItem('gemini_api_model') || 'gemini-3-flash-preview';
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check for last backup date
    const lastBackup = localStorage.getItem('crm_last_backup_date');
    if (!lastBackup) {
      // If no backup ever, show reminder after 7 days of first use
      const firstUse = localStorage.getItem('crm_first_use_date');
      if (!firstUse) {
        localStorage.setItem('crm_first_use_date', new Date().toISOString());
      } else {
        const daysSinceFirstUse = (new Date().getTime() - new Date(firstUse).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceFirstUse > 7) setShowBackupReminder(true);
      }
    } else {
      const daysSinceLastBackup = (new Date().getTime() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastBackup > 30) {
        setShowBackupReminder(true);
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!apiKey) {
      setShowApiKeyModal(true);
    }
  }, [apiKey]);

  const handleSaveApiKey = (newKey: string, newModel: string) => {
    localStorage.setItem('gemini_api_key', newKey);
    localStorage.setItem('gemini_api_model', newModel);
    setApiKey(newKey);
    setApiModel(newModel);
    setShowApiKeyModal(false);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="flex h-[100dvh] bg-rose-50/30 dark:bg-[#181a1b] overflow-hidden transition-colors duration-200 overscroll-none touch-manipulation">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#181a1b]/80 dark:backdrop-blur-md border-b border-rose-100 dark:border-[#4a2b2d] flex items-center justify-between px-4 z-40 transition-colors duration-200">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-rose-500 dark:text-rose-400 mr-2" />
          <span className="font-bold text-lg text-rose-900 dark:text-white">TMV Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowApiKeyModal(true)} className="p-2 text-gray-600 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-[#3a2224] rounded-md transition-colors">
            <Key className="w-5 h-5" />
          </button>
          <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-[#3a2224] rounded-md transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-[#3a2224] rounded-md transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 md:w-64 bg-white dark:bg-[#181a1b] border-r border-rose-100 dark:border-[#4a2b2d] flex flex-col transform transition-all duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-rose-100 dark:border-[#4a2b2d] shrink-0">
          <div className="flex items-center">
            <Sparkles className="w-6 h-6 text-rose-500 dark:text-rose-400 mr-2" />
            <span className="font-bold text-lg text-rose-900 dark:text-white">TMV Assistant</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-gray-500 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-[#3a2224] rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-3 md:py-2.5 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300'
                    : 'text-gray-600 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-[#3a2224] hover:text-rose-900 dark:hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-rose-100 dark:border-[#4a2b2d] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              <div className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-rose-200 dark:bg-rose-500/20 flex items-center justify-center text-rose-700 dark:text-rose-400 font-bold shrink-0">
                A
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-700 dark:text-rose-100 truncate">Trợ lý Thẩm mỹ</p>
                <p className="text-xs text-gray-500 dark:text-rose-300/70 truncate">Chuyên viên tư vấn</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowApiKeyModal(true)} className="hidden md:flex p-2 text-gray-500 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-[#3a2224] rounded-md transition-colors" title="Cấu hình API Key">
                <Key className="w-4 h-4" />
              </button>
              <button onClick={toggleTheme} className="hidden md:flex p-2 text-gray-500 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-[#3a2224] rounded-md transition-colors">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 scroll-smooth overscroll-contain momentum-scroll">
        {showBackupReminder && location.pathname !== '/settings' && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-4 sticky top-16 md:top-0 z-30 shadow-md">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Đã hơn 30 ngày bạn chưa sao lưu dữ liệu. Hãy sao lưu để tránh mất mát!</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/settings" className="bg-white text-amber-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-amber-50 transition-colors flex items-center gap-1">
                <Download className="w-3 h-3" /> Sao lưu ngay
              </Link>
              <button onClick={() => setShowBackupReminder(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div className="p-4 md:p-8 pb-24 md:pb-8 pb-safe max-w-6xl mx-auto dark:bg-[#281718] min-h-full">
          <Outlet />
        </div>
      </main>

      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onSave={handleSaveApiKey} 
        onClose={apiKey ? () => setShowApiKeyModal(false) : undefined}
        currentKey={apiKey}
        currentModel={apiModel}
      />
    </div>
  );
}
