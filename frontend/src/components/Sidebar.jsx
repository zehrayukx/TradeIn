import React from 'react';
import { Home, BarChart2, Bell, Heart, Settings, LogIn, LogOut, Wallet, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, isLoggedIn, setIsLoggedIn, alarmNotifCount = 0 }) => {
  const location = useLocation();

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

  return (
    <aside className={`bg-[#0f1117] border-r border-gray-800 h-[calc(100vh-64px)] sticky top-16 transition-all duration-300 z-40 flex flex-col ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
      <div className="flex flex-col h-full py-6 w-full overflow-hidden">
        <ul className="space-y-1 px-3 flex-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link to={item.path} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-blue-600/10 text-blue-500 font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <item.icon size={20} />
                <span className="text-sm">{item.name}</span>
              </Link>
            </li>
          ))}
          {isLoggedIn && protectedItems.map((item) => (
            <li key={item.name}>
              <Link to={item.path} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-blue-600/10 text-blue-500 font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <div className="relative">
                  <item.icon size={20} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none animate-pulse">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-sm">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="px-4 mt-auto border-t border-gray-800 pt-4 pb-4">
          {isLoggedIn ? (
            <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-semibold">
              <LogOut size={20} />
              <span className="text-sm">Çıkış Yap</span>
            </button>
          ) : (
            <Link to="/login" className="flex items-center gap-3 w-full p-3 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all font-semibold">
              <LogIn size={20} />
              <span className="text-sm">Giriş Yap</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
