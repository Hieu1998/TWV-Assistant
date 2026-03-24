import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, PenTool, MessageCircleHeart, CalendarDays, Sparkles, Users, CalendarClock, Menu, X } from 'lucide-react';
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
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-rose-50/30 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-rose-100 flex items-center justify-between px-4 z-40">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-rose-500 mr-2" />
          <span className="font-bold text-lg text-rose-900">TMV Assistant</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 hover:bg-rose-50 rounded-md">
          <Menu className="w-6 h-6" />
        </button>
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
        "fixed inset-y-0 left-0 z-50 w-72 md:w-64 bg-white border-r border-rose-100 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-rose-100 shrink-0">
          <div className="flex items-center">
            <Sparkles className="w-6 h-6 text-rose-500 mr-2" />
            <span className="font-bold text-lg text-rose-900">TMV Assistant</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-gray-500 hover:bg-rose-50 rounded-md">
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
                    ? 'bg-rose-100 text-rose-900'
                    : 'text-gray-600 hover:bg-rose-50 hover:text-rose-900'
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-rose-100 shrink-0">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-bold shrink-0">
              A
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-700 truncate">Trợ lý Thẩm mỹ</p>
              <p className="text-xs text-gray-500 truncate">Chuyên viên tư vấn</p>
            </div>
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
