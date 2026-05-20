import React from 'react';
import { Home, BarChart2, Bell, Heart, Settings, LogIn, LogOut, Wallet, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, isLoggedIn, setIsLoggedIn }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Anasayfa', icon: Home, path: '/' },
    { name: 'Piyasalar', icon: BarChart2, path: '/markets' },
    { name: 'Ayarlar', icon: Settings, path: '/settings' },
  ];

  const protectedItems = [
    { name: 'Profilim', icon: User, path: '/profile' },
    { name: 'Bildirimler', icon: Heart, path: '/notifications' },
    { name: 'Alarmlar', icon: Bell, path: '/alarms' },
    { name: 'Portföyüm', icon: Wallet, path: '/portfolio' },
  ];

  return (
    <aside className={`bg-[#0f1117] border-r border-gray-800 h-[calc(100vh-64px)] sticky top-16 transition-all duration-300 z-40 flex flex-col ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
      <div className="flex flex-col h-full py-6 w-full overflow-hidden">
        {/* Navigasyon Listesi */}
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
                <item.icon size={20} />
                <span className="text-sm">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* ALT KISIM: Görseldeki gibi Sade Giriş/Çıkış */}
        <div className="px-4 mt-auto border-t border-gray-800 pt-4 pb-4">
          {isLoggedIn ? (
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-semibold"
            >
              <LogOut size={20} />
              <span className="text-sm">Çıkış Yap</span>
            </button>
          ) : (
            <Link 
              to="/login" 
              className="flex items-center gap-3 w-full p-3 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all font-semibold"
            >
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