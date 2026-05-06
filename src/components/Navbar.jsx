import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="h-16 bg-[#0d1226]/80 backdrop-blur-md border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 text-xl font-black text-white italic tracking-tighter">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm not-italic">TI</div>
        TRADEIN
      </div>
      
      <div className="flex-1 max-w-xl mx-10 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Varlık, kişi veya konu ara..." 
          className="w-full bg-[#161d31] border border-white/5 rounded-xl py-2 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-6">
        <Bell size={20} className="text-slate-400 cursor-pointer hover:text-white transition" />
        <div className="flex items-center gap-3 pl-6 border-l border-white/10 cursor-pointer group">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-purple-500 rounded-full border border-white/10"></div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-white group-hover:text-blue-400">Zehra</span>
            <ChevronDown size={14} className="text-slate-500" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
