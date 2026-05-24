import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Menu, LogOut, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ toggleSidebar, isLoggedIn, user, handleLogout, openCreatePost, searchQuery, setSearchQuery }) => {
  const [userResults, setUserResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchQuery && searchQuery.trim().length > 0) {
        try {
          const res = await axios.get(`http://127.0.0.1:8000/arama?q=${searchQuery}`);
          setUserResults(res.data);
          setIsDropdownOpen(true);
        } catch (error) {
          console.error("Kullanıcı arama hatası:", error);
        }
      } else {
        setUserResults([]);
        setIsDropdownOpen(false);
      }
    };
    const delayDebounceFn = setTimeout(() => { fetchUsers(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <nav className="bg-[#0f1117] border-b border-gray-800 sticky top-0 z-50">
      <div className="px-4 h-16 flex items-center justify-between">

        {/* SOL: Logo ve Hamburger */}
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
            <Menu size={24} />
          </button>
          <Link to="/" className="text-2xl font-black bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent tracking-tighter">
            TradeIn
          </Link>
        </div>

        {/* ORTA: Arama */}
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            placeholder="Kullanıcı veya gönderi ara..."
            className="w-full bg-[#1a1d26] border border-gray-800 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {isDropdownOpen && userResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-[#1a1d26] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 text-[10px] font-bold text-gray-500 bg-[#0f1117] tracking-wider">KULLANICILAR</div>
              {userResults.map(u => (
                <Link
                  key={u.username}
                  to={`/profile/${u.username}`}
                  onClick={() => { setIsDropdownOpen(false); if (setSearchQuery) setSearchQuery(""); }}
                  className="flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors"
                >
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full border border-gray-700" />
                  <div>
                    <p className="text-sm font-bold text-white">{u.name}</p>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                </Link>
              ))}
              <div className="p-3 text-xs text-center text-blue-500 hover:bg-gray-800 border-t border-gray-800 transition-colors">
                "{searchQuery}" içeren tüm gönderiler arkada listeleniyor
              </div>
            </div>
          )}
        </div>

        {/* SAĞ: Aksiyonlar */}
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <button onClick={openCreatePost} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all flex items-center gap-2 group" title="Gönderi Paylaş">
              <PlusCircle size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold hidden sm:block">Paylaş</span>
            </button>
          )}
          {isLoggedIn && (
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          )}
          <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
            <Bell size={24} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f1117]"></span>
          </button>
          {isLoggedIn ? (
            <Link to="/profile" className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] ml-2">
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&color=fff`} alt="Profile" className="w-full h-full rounded-full border border-[#0f1117] object-cover" />
            </Link>
          ) : (
            <Link to="/login" className="flex items-center gap-2 bg-[#1a1d26] hover:bg-gray-800 border border-gray-700 px-4 py-1.5 rounded-full transition-colors ml-2">
              <User size={18} className="text-gray-400" />
              <span className="text-sm font-bold">Giriş</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
