import React, { useState, useEffect } from 'react';
import { TrendingUp, MoreHorizontal } from 'lucide-react';
import axios from 'axios';

const TrendSidebar = ({ onTrendClick }) => {
  // 🎯 YENİ: Trendleri tutacak state
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sayfa yüklendiğinde gerçek istatistikleri çek
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/trendler');
        setTrends(response.data);
      } catch (error) {
        console.error("Trend istatistikleri çekilemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  return (
    <div className="bg-[#1a1d26] border border-gray-800 rounded-2xl p-5 shadow-lg">
      <h3 className="font-black text-xl mb-4 flex items-center gap-2 text-white">
        <TrendingUp size={22} className="text-blue-500" /> Trendler
      </h3>
      
      <div className="flex flex-col gap-5">
        {loading ? (
          <div className="text-center text-xs text-blue-500 animate-pulse py-2">Gündem hesaplanıyor...</div>
        ) : (
          trends.map(trend => (
            <div 
              key={trend.id} 
              onClick={() => onTrendClick && onTrendClick(trend.name)} 
              className="flex items-start justify-between cursor-pointer group"
            >
              <div>
                <p className="text-[11px] text-gray-500 font-semibold tracking-wide">Türkiye konumunda gündemde</p>
                <p className="font-bold text-white group-hover:text-blue-500 transition-colors">#{trend.name}</p>
                {/* 🎯 GERÇEK SAYIM BURADA GÖSTERİLİYOR */}
                <p className="text-xs text-gray-500">
                  {trend.count > 0 ? `${trend.count.toLocaleString('tr-TR')} gönderi` : 'Henüz gönderi yok'}
                </p>
              </div>
              <button className="text-gray-600 hover:text-blue-500 transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrendSidebar;