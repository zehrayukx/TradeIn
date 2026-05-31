import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, getThemeClasses } from '../context/ThemeContext';

const RecommendedTraders = ({ onFollowUpdate }) => {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTraders = async () => {
      try {
        const token = localStorage.getItem("tradein_token");
        const headers = token && token !== "undefined" && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get('http://127.0.0.1:8000/onerilen-kullanicilar', { headers });
        setTraders(response.data);
      } catch (error) {
        console.error("Önerilen kullanıcılar çekilemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTraders();
  }, []);

  const handleFollow = async (userId) => {
    const token = localStorage.getItem("tradein_token");
    if (!token || token === "undefined" || token === "null") {
      alert("Takip etmek için giriş yapmalısınız!");
      return;
    }
    try {
      const response = await axios.post(`http://127.0.0.1:8000/takip-et/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const isNowFollowing = response.data.mesaj.includes("takip edildi");
      setTraders(prev => prev.map(tr => tr.id === userId ? { ...tr, is_following: isNowFollowing } : tr));
      
      // 🚀 EKLENEN TEK FONKSİYONELİTE BURASI: 
      // Anasayfaya "Ben butona bastım, postları güncelle" sinyali gönderiliyor
      if (onFollowUpdate) {
        onFollowUpdate();
      }

    } catch (error) {
      console.error("Takip hatası:", error);
    }
  };

  return (
    <div className={`${t.cardBg} border ${t.cardBorder} rounded-2xl p-5 shadow-lg mt-6 transition-colors duration-300`}>
      <h3 className={`font-black text-xl mb-4 ${t.textPrimary}`}>Kimi Takip Etmeli</h3>
      <div className="flex flex-col gap-5">
        {loading ? (
          <div className="text-center text-sm text-blue-500 animate-pulse py-4">Trend olanlar aranıyor...</div>
        ) : traders.length > 0 ? (
          traders.map(trader => (
            <div key={trader.id} className="flex items-center justify-between group">
              <Link to={`/profile/${trader.username}`} className="flex items-center gap-3">
                <img src={trader.avatar} alt={trader.name} className={`w-10 h-10 rounded-full border ${t.cardBorder} group-hover:border-blue-500 transition-colors`} />
                <div>
                  <h4 className={`font-bold text-sm ${t.textPrimary} group-hover:underline decoration-blue-500`}>{trader.name}</h4>
                  <p className={`text-[11px] ${t.textSecond}`}>@{trader.username}</p>
                </div>
              </Link>
              <button
                onClick={() => handleFollow(trader.id)}
                className={`p-2 rounded-full transition-all focus:outline-none ${
                  trader.is_following
                    ? `${t.cardBg2} text-blue-500 hover:bg-red-500/20 hover:text-red-500`
                    : `${t.isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-700'}`
                }`}
                title={trader.is_following ? "Takipten Çık" : "Takip Et"}
              >
                {trader.is_following ? <UserCheck size={16} /> : <UserPlus size={16} />}
              </button>
            </div>
          ))
        ) : (
          <div className={`text-center text-xs ${t.textSecond} py-4`}>Önerilecek kullanıcı bulunamadı.</div>
        )}
      </div>
    </div>
  );
};

export default RecommendedTraders;