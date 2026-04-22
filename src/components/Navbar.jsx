import { Search, User, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <nav className="sticky top-0 z-50 bg-[#0f1117]/80 backdrop-blur-md border-b border-gray-800 px-6 py-3 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
        TradeIn
      </Link>

      <div className="relative w-1/3">
        <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Hisse, kripto veya kullanıcı ara..."
          className="w-full bg-[#161a23] border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      <div className="flex items-center gap-4">
        <Link to="/login" className="text-sm font-medium hover:text-blue-400 transition">Giriş Yap</Link>
        <Link to="/register" className="bg-blue-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-500 transition">Üye Ol</Link>
        <div className="h-8 w-[1px] bg-gray-800 mx-2"></div>
        <Bell className="text-gray-400 cursor-pointer hover:text-white" size={20} />
        <div className="w-8 h-8 bg-gray-700 rounded-full border border-gray-600 flex items-center justify-center cursor-pointer">
          <User size={18} className="text-gray-300" />
        </div>
      </div>
    </nav>
  );
};

// EKSİK OLAN VE HATAYA SEBEP OLAN SATIR:
export default Navbar;