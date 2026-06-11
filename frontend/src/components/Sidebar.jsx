import React, { useState, useEffect } from 'react';
import { Home, BarChart2, Bell, Heart, Settings, LogIn, LogOut, Wallet, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'; // 🚀 Axios eklendi
import { useTheme, getThemeClasses } from '../context/ThemeContext';

// 🚀 1. ADIM: Props'lardan notifBadge ve alarmNotifCount'u sildik, çünkü artık bunları içeride biz yöneteceğiz
const Sidebar = ({ isOpen, isLoggedIn, setIsLoggedIn }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  // 🚀 2. ADIM: Sayıları tutacak lokal State'ler
  const [notifBadge, setNotifBadge] = useState(0);
  const [alarmNotifCount, setAlarmNotifCount] = useState(0);

  // 🚀 3. ADIM: Bildirimleri arkadan sessizce çeken asenkron ajan
  useEffect(() => {
    if (!isLoggedIn) {
      setNotifBadge(0);
      setAlarmNotifCount(0);
      return;
    }

    const fetchBadges = async () => {
      try {
        const token = localStorage.getItem("tradein_token");
        if (!token) return;

        // ⚠️ DİKKAT: Aşağıdaki URL'leri kendi backend uçlarına göre düzenleyebilirsin
        // Sosyal bildirimleri çek ve sadece okunmayanları (is_read === false) say
        const notifRes = await axios.get("http://127.0.0.1:8000/bildirimler", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const unreadNotifs = notifRes.data.filter(n => !n.is_read).length;
        setNotifBadge(unreadNotifs);

        // Alarmları çek ve sadece okunmayanları say
        const alarmRes = await axios.get("http://127.0.0.1:8000/alarmlar/bildirimler", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const unreadAlarms = alarmRes.data.filter(a => !a.is_read).length;
        setAlarmNotifCount(unreadAlarms);

      } catch (error) {
        console.error("Sidebar rozet sayıları çekilemedi:", error);
      }
    };

    // İlk açılışta ve sayfa her değiştiğinde kontrol et
    fetchBadges();

    // 🎯 JÜRİ ŞOVU: Her 15 saniyede bir arkadan güncelleyerek "Canlı Bildirim" hissi verir
    const interval = setInterval(fetchBadges, 15000);
    return () => clearInterval(interval);

  }, [isLoggedIn, location.pathname]); 

  const navItems = [
    { name: 'Anasayfa', icon: Home, path: '/' },
    { name: 'Piyasalar', icon: BarChart2, path: '/markets' },
    { name: 'Ayarlar', icon: Settings, path: '/settings' },
  ];

  const protectedItems = [
    { name: 'Profilim', icon: User, path: '/profile', badge: 0 },
    { name: 'Bildirimler', icon: Heart, path: '/notifications', badge: notifBadge }, // 🚀 Lokal state'e bağlandı
    { name: 'Alarmlar', icon: Bell, path: '/alarms', badge: alarmNotifCount },       // 🚀 Lokal state'e bağlandı
    { name: 'Portföyüm', icon: Wallet, path: '/portfolio', badge: 0 },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogoutClick = () => {
    localStorage.removeItem("tradein_token");
    if (setIsLoggedIn) setIsLoggedIn(false);
    navigate("/login");
  };

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
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none animate-pulse shadow-sm">
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
              onClick={handleLogoutClick}
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