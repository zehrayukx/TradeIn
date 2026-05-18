import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RecommendedTraders = () => {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sayfa açıldığında önerilen kralları veritabanından çek
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

  // 🚀 YENİ: Sidebar üzerinden direkt takip etme yeteneği!
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
      
      // Anlık olarak yan paneldeki takip ikonunu değiştir
      setTraders(prevTraders => 
        prevTraders.map(tr => {
          if (tr.id === userId) {
            return { ...tr, is_following: isNowFollowing };
          }
          return tr;
        })
      );
    } catch (error) {
      console.error("Takip hatası:", error);
    }
  };

  return (
    <div className="bg-[#1a1d26] border border-gray-800 rounded-2xl p-5 shadow-lg mt-6">
      <h3 className="font-black text-xl mb-4 text-white">Kimi Takip Etmeli</h3>
      
      <div className="flex flex-col gap-5">
        {loading ? (
          <div className="text-center text-sm text-blue-500 animate-pulse py-4">Trend olanlar aranıyor...</div>
        ) : traders.length > 0 ? (
          traders.map(trader => (
            <div key={trader.id} className="flex items-center justify-between group">
              <Link to={`/profile/${trader.username}`} className="flex items-center gap-3">
                <img src={trader.avatar} alt={trader.name} className="w-10 h-10 rounded-full border border-gray-700 group-hover:border-blue-500 transition-colors" />
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:underline decoration-blue-500">{trader.name}</h4>
                  <p className="text-[11px] text-gray-500">@{trader.username}</p>
                </div>
              </Link>
              
              <button 
                onClick={() => handleFollow(trader.id)}
                className={`p-2 rounded-full transition-all focus:outline-none ${
                  trader.is_following 
                    ? 'bg-gray-800 text-blue-500 hover:bg-red-500/20 hover:text-red-500' 
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
                title={trader.is_following ? "Takipten Çık" : "Takip Et"}
              >
                {trader.is_following ? <UserCheck size={16} /> : <UserPlus size={16} />}
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-xs text-gray-500 py-4">Önerilecek kullanıcı bulunamadı.</div>
        )}
      </div>
    </div>
  );
};

export default RecommendedTraders;