import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Menu, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ toggleSidebar, isLoggedIn, user, handleLogout }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Baş harfleri alan yardımcı fonksiyon
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // 🚀 CANLI ARAMA (DEBOUNCE MANTIĞI)
  useEffect(() => {
    // Kullanıcı yazmayı bitirdikten 300ms sonra backend'e istek atılır (Sunucuyu yormamak için)
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim() !== "") {
        try {
          const response = await axios.get(`http://127.0.0.1:8000/arama?q=${searchTerm}`);
          setSearchResults(response.data);
          setIsDropdownOpen(true);
        } catch (error) {
          console.error("Arama sırasında hata oluştu:", error);
        }
      } else {
        setSearchResults([]);
        setIsDropdownOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Enter tuşuna basılırsa
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== "") {
      navigate(`/profile/${searchTerm.trim()}`);
      setSearchTerm("");
      setIsDropdownOpen(false);
    }
  };

  // Açılır menüden birine tıklanırsa
  const handleResultClick = (username) => {
    navigate(`/profile/${username}`);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  // Menü dışına tıklanınca dropdown'ı kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-[#0f1117] border-b border-gray-800 sticky top-0 z-50">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* SOL GRUP */}
        <div className="flex items-center gap-2 min-w-max">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">T</div>
            <span className="text-xl font-black tracking-tighter text-white">TradeIn</span>
          </Link>
        </div>

        {/* ORTA: Arama Barı ve Canlı Dropdown */}
        <div className="flex-1 max-w-md mx-6" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => { if (searchResults.length > 0) setIsDropdownOpen(true); }}
              placeholder="Kullanıcı ara..."
              className="w-full bg-[#1a1d26] border border-gray-700 rounded-full py-1.5 pl-10 pr-4 text-sm focus:border-blue-500 outline-none transition-all text-white"
            />

            {/* AÇILIR MENÜ (DROPDOWN) */}
            {isDropdownOpen && (
              <div className="absolute top-full mt-2 w-full bg-[#1a1d26] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <div 
                      key={result.username}
                      onClick={() => handleResultClick(result.username)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer transition-all border-b border-gray-800/50 last:border-0"
                    >
                      <img 
                        src={result.avatar} 
                        alt={result.username} 
                        className="w-8 h-8 rounded-full border border-gray-700"
                      />
                      <div>
                        <div className="text-sm font-bold text-white">{result.name}</div>
                        <div className="text-xs text-gray-500">@{result.username}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Kullanıcı bulunamadı
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SAĞ GRUP */}
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Çıkış Yap">
              <LogOut size={20} />
            </button>
          )}
          <button className="p-2 text-gray-400 hover:text-white transition-colors"><Bell size={20} /></button>
          
          <Link to={isLoggedIn ? "/profile" : "/login"} className="flex items-center gap-2 bg-[#1a1d26] border border-gray-700 p-1 pr-3 rounded-full hover:bg-gray-800 transition-all group">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-[10px] group-hover:scale-105 transition-transform">
              {isLoggedIn && user ? getInitials(user.name) : <User size={16} />}
            </div>
            <span className="text-xs font-bold hidden md:block text-white">
              {isLoggedIn && user ? user.name : "Giriş Yap"}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;