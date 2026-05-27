import React from 'react';
import { Home, BarChart2, Bell, Heart, Settings, LogIn, LogOut, Wallet, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme, getThemeClasses } from '../context/ThemeContext';

const Sidebar = ({ isOpen, isLoggedIn, setIsLoggedIn, alarmNotifCount = 0 }) => {
  const location = useLocation();
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  const navItems = [
    { name: 'Anasayfa', icon: Home, path: '/' },
    { name: 'Piyasalar', icon: BarChart2, path: '/markets' },
    { name: 'Ayarlar', icon: Settings, path: '/settings' },
  ];

  const protectedItems = [
    { name: 'Profilim', icon: User, path: '/profile', badge: 0 },
    { name: 'Bildirimler', icon: Heart, path: '/notifications', badge: 0 },
    { name: 'Alarmlar', icon: Bell, path: '/alarms', badge: alarmNotifCount },
    { name: 'Portföyüm', icon: Wallet, path: '/portfolio', badge: 0 },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`${t.sidebarBg} border-r ${t.navBorder} h-[calc(100vh-64px)] sticky top-16 transition-all duration-300 z-40 flex flex-col ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
      <div className="flex flex-col h-full py-6 w-full overflow-hidden">
        <ul className="space-y-1 px-3 flex-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium
                  ${isActive(item.path)
                    ? t.linkActive
                    : `${t.linkInactive} ${t.linkHover}`
                  }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
          {isLoggedIn && protectedItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium
                  ${isActive(item.path)
                    ? t.linkActive
                    : `${t.linkInactive} ${t.linkHover}`
                  }`}
              >
                <div className="relative">
                  <item.icon size={20} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none animate-pulse">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className={`px-4 mt-auto border-t ${t.divider} pt-4 pb-4`}>
          {isLoggedIn ? (
            <button
              onClick={() => setIsLoggedIn(false)}
              className={`flex items-center gap-3 w-full p-3 ${t.logoutText} ${t.logoutHover} rounded-xl transition-all font-semibold text-sm`}
            >
              <LogOut size={20} />
              <span>Çıkış Yap</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={`flex items-center gap-3 w-full p-3 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all font-semibold text-sm`}
            >
              <LogIn size={20} />
              <span>Giriş Yap</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
