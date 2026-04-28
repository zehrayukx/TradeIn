import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, BarChart2, Bell, Settings, User, LogOut } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Anasayfa', path: '/', icon: <Home size={22} /> },
    { name: 'Keşfet', path: '/explore', icon: <Compass size={22} /> },
    { name: 'Piyasalar', path: '/markets', icon: <BarChart2 size={22} /> },
    { name: 'Ayarlar', path: '/settings', icon: <Settings size={22} /> },
  ];

  return (
    <aside className="w-64 sticky top-[116px] h-[calc(100vh-120px)] flex flex-col justify-between py-4">
      <div className="space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive 
                ? 'bg-blue-600/10 text-blue-500' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="border-t border-gray-800 pt-4 px-4">
        <button className="flex items-center gap-4 text-gray-500 hover:text-red-400 transition-colors">
          <LogOut size={22} />
          <span className="font-medium">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
