import React from 'react';
import { TrendingUp, MoreHorizontal } from 'lucide-react';

const TrendSidebar = ({ onTrendClick }) => { // 🎯 YENİ: Tıklanma bilgisini yukarı yollayan prop
  const trends = [
    { id: 1, name: 'Borsa', count: '14.2B' },
    { id: 2, name: 'Altın', count: '9.8B' },
    { id: 3, name: 'Kripto', count: '7.1B' },
    { id: 4, name: 'Gümüş', count: '3.4B' }
  ];

  return (
    <div className="bg-[#1a1d26] border border-gray-800 rounded-2xl p-5 shadow-lg">
      <h3 className="font-black text-xl mb-4 flex items-center gap-2 text-white">
        <TrendingUp size={22} className="text-blue-500" /> Trendler
      </h3>
      
      <div className="flex flex-col gap-5">
        {trends.map(trend => (
          <div 
            key={trend.id} 
            onClick={() => onTrendClick && onTrendClick(trend.name)} // 🚀 Tıklanınca Home'a haber ver!
            className="flex items-start justify-between cursor-pointer group"
          >
            <div>
              <p className="text-[11px] text-gray-500 font-semibold tracking-wide">Türkiye konumunda gündemde</p>
              <p className="font-bold text-white group-hover:text-blue-500 transition-colors">#{trend.name}</p>
              <p className="text-xs text-gray-500">{trend.count} gönderi</p>
            </div>
            <button className="text-gray-600 hover:text-blue-500 transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendSidebar;