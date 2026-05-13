import React, { useState } from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar, isLoggedIn }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== "") {
      // Yazılan isme göre profil sayfasına yönlendirir
      navigate(`/profile/${searchTerm.trim()}`);
      setSearchTerm("");
    }
  };

  return (
    <nav className="bg-[#0f1117] border-b border-gray-800 sticky top-0 z-50">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* SOL GRUP: Tam Sola Yaslı */}
        <div className="flex items-center gap-2 min-w-max">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">T</div>
            <span className="text-xl font-black tracking-tighter text-white">TradeIn</span>
          </Link>
        </div>

        {/* ORTA: Arama Barı */}
        <div className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Kullanıcı ara ve Enter'a bas..."
              className="w-full bg-[#1a1d26] border border-gray-700 rounded-full py-1.5 pl-10 pr-4 text-sm focus:border-blue-500 outline-none transition-all text-white"
            />
          </div>
        </div>

        {/* SAĞ: Profil ve Bildirim */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-white"><Bell size={20} /></button>
          <Link to={isLoggedIn ? "/profile" : "/login"} className="flex items-center gap-2 bg-[#1a1d26] border border-gray-700 p-1 pr-3 rounded-full hover:bg-gray-800 transition-all group">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
              {isLoggedIn ? "PK" : <User size={16} />}
            </div>
            <span className="text-xs font-bold hidden md:block">
              {isLoggedIn ? "Profilim" : "Giriş Yap"}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;