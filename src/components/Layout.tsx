import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, PenTool, MessageCircleHeart, CalendarDays, Sparkles, Users, CalendarClock, Menu, X, Sun, Moon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/customers', icon: Users, label: 'Quản lý Khách hàng' },
  { to: '/appointments', icon: CalendarClock, label: 'Lịch hẹn & Tái khám' },
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
  const location = useLocation();

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
    <div className="flex h-screen bg-rose-50/30 dark:bg-[#09090b] overflow-hidden transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900/80 dark:backdrop-blur-md border-b border-rose-100 dark:border-zinc-800 flex items-center justify-between px-4 z-40 transition-colors duration-200">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-rose-500 dark:text-rose-400 mr-2" />
          <span className="font-bold text-lg text-rose-900 dark:text-zinc-100">TMV Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-md transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-md transition-colors">
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
        "fixed inset-y-0 left-0 z-50 w-72 md:w-64 bg-white dark:bg-zinc-900 border-r border-rose-100 dark:border-zinc-800 flex flex-col transform transition-all duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-rose-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center">
            <Sparkles className="w-6 h-6 text-rose-500 dark:text-rose-400 mr-2" />
            <span className="font-bold text-lg text-rose-900 dark:text-zinc-100">TMV Assistant</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-gray-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-md transition-colors">
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
                    ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-900 dark:text-rose-400'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-zinc-800/50 hover:text-rose-900 dark:hover:text-zinc-100'
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-rose-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              <div className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-rose-200 dark:bg-rose-500/20 flex items-center justify-center text-rose-700 dark:text-rose-400 font-bold shrink-0">
                A
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-200 truncate">Trợ lý Thẩm mỹ</p>
                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">Chuyên viên tư vấn</p>
              </div>
            </div>
            <button onClick={toggleTheme} className="hidden md:flex p-2 text-gray-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-md transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
