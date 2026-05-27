import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Menu, LogOut, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, getThemeClasses } from '../context/ThemeContext';

const Navbar = ({ toggleSidebar, isLoggedIn, user, handleLogout, openCreatePost, searchQuery, setSearchQuery }) => {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  const [userResults, setUserResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef(null);

  // Tarayıcı autocomplete'i engelle — mount sonrası input'u sıfırla
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setAttribute('autocomplete', 'off');
      inputRef.current.setAttribute('readonly', 'readonly');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.removeAttribute('readonly');
      }, 200);
    }
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const q = searchQuery?.trim();
      if (q && q.length > 0) {
        try {
          const res = await axios.get(`http://127.0.0.1:8000/arama?q=${q}`);
          setUserResults(res.data);
          setIsDropdownOpen(true);
        } catch { setUserResults([]); setIsDropdownOpen(false); }
      } else {
        setUserResults([]);
        setIsDropdownOpen(false);
      }
    };
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <nav className={`${t.navBg} border-b ${t.navBorder} sticky top-0 z-50 transition-colors duration-300`}>
      {/* Sahte gizli inputlar — tarayıcının şifre yöneticisini yanılt */}
      <input type="text"     name="fake_user_field"  style={{ display:'none' }} readOnly tabIndex={-1} />
      <input type="password" name="fake_pass_field"  style={{ display:'none' }} readOnly tabIndex={-1} />
      <input type="email"    name="fake_email_field" style={{ display:'none' }} readOnly tabIndex={-1} />

      <div className="px-4 h-16 flex items-center justify-between gap-4">

        {/* SOL */}
        <div className="flex items-center gap-4 shrink-0">
          <button onClick={toggleSidebar} className={`p-2 ${t.textMuted} ${t.hoverText} rounded-lg ${t.hoverBg} transition-colors`}>
            <Menu size={24} />
          </button>
          <Link to="/" className="text-2xl font-black bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent tracking-tighter">
            TradeIn
          </Link>
        </div>

        {/* ORTA */}
        <div className="relative w-full max-w-md hidden md:block">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.textMuted} pointer-events-none`} size={18} />
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            name={`search_${Math.random()}`}
            id="tradein-search-unique"
            value={searchQuery || ''}
            onChange={e => setSearchQuery && setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery?.trim()) setIsDropdownOpen(true); }}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            placeholder="Kullanıcı veya gönderi ara..."
            className={`w-full ${t.searchBg} border ${t.searchBorder} rounded-full pl-10 pr-4 py-2 text-sm ${t.textPrimary} ${t.placeholder} focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all`}
          />
          {isDropdownOpen && userResults.length > 0 && (
            <div className={`absolute top-full mt-2 w-full ${t.dropdownBg} border ${t.cardBorder} rounded-xl shadow-2xl overflow-hidden z-50`}>
              <div className={`p-2 text-[10px] font-bold ${t.textMuted} ${t.cardBg2} tracking-wider`} style={{ textTransform: 'none' }}>Kullanıcılar</div>
              {userResults.map(u => (
                <Link key={u.username} to={`/profile/${u.username}`}
                  onClick={() => { setIsDropdownOpen(false); setSearchQuery && setSearchQuery(''); }}
                  className={`flex items-center gap-3 p-3 ${t.hoverBg} transition-colors`}>
                  <img src={u.avatar} alt={u.name} className={`w-8 h-8 rounded-full border ${t.border}`} />
                  <div>
                    <p className={`text-sm font-bold ${t.textPrimary}`}>{u.name}</p>
                    <p className={`text-xs ${t.textMuted}`}>@{u.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* SAĞ */}
        <div className="flex items-center gap-3 shrink-0">
          {isLoggedIn && openCreatePost && (
            <button onClick={openCreatePost} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all flex items-center gap-2 group">
              <PlusCircle size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold hidden sm:block">Paylaş</span>
            </button>
          )}
          {isLoggedIn && handleLogout && (
            <button onClick={handleLogout} className={`p-2 ${t.textMuted} hover:text-red-500 transition-colors`}>
              <LogOut size={20} />
            </button>
          )}
          <button className={`p-2 ${t.textMuted} ${t.hoverText} transition-colors relative`}>
            <Bell size={24} />
            <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${theme === 'dark' ? 'border-[#0f1117]' : 'border-white'}`} />
          </button>
          {isLoggedIn ? (
            <Link to="/profile" className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] ml-1 shrink-0">
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=random&color=fff`} alt="Profil"
                className={`w-full h-full rounded-full border-2 ${theme === 'dark' ? 'border-[#0f1117]' : 'border-white'} object-cover`} />
            </Link>
          ) : (
            <Link to="/login" className={`flex items-center gap-2 ${t.cardBg2} ${t.hoverBg} border ${t.border} px-4 py-1.5 rounded-full transition-colors ml-1`}>
              <User size={18} className={t.textMuted} />
              <span className={`text-sm font-bold ${t.textPrimary}`}>Giriş</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
