import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { POSTS_DATA } from '../data/mockData';
import FeedCard from '../components/FeedCard';
import TrendSidebar from '../components/TrendSidebar';
import RecommendedTraders from '../components/RecommendedTraders';

const Home = () => {
  // 1. Durum Yönetimi (State'ler)
  const [activeTab, setActiveTab] = useState('Trendler');
  const [posts, setPosts] = useState([]); // Gerçek verileri tutacağımız sepet
  const [loading, setLoading] = useState(true); // Yükleniyor animasyonu için

  const tabs = ['Trendler', 'Borsa', 'Altın', 'Gümüş', 'Kripto'];

  // 2. Sayfa yüklendiğinde Backend'e bağlanıp verileri çekiyoruz
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Senin FastAPI backend'ine istek atıyoruz
        const response = await axios.get('http://127.0.0.1:8000/populer-postlar');
        
        // 3. ADAPTER MANTIĞI: Senin veritabanı formatını, Zehra'nın tasarımına uyduruyoruz
        const gercekVeriler = response.data.map((post) => ({
          id: post.post_id,
          user: { 
            name: post.yazar, 
            // Kullanıcı adına göre otomatik profil resmi oluşturan ücretsiz servis
            avatar: `https://ui-avatars.com/api/?name=${post.yazar}&background=random&color=fff`, 
            isVerified: false 
          },
          content: post.icerik,
          // Senin veritabanından gelen zaman damgasını güzel bir saate çeviriyoruz
          time: new Date(post.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' }),
          likes: Math.floor(Math.random() * 50) + 1, // Şimdilik rastgele beğeni sayısı
          comments: 0,
          isFollowed: false
        }));

        setPosts(gercekVeriler); // Veritabanından gelen postları sepete at
      } catch (error) {
        console.error("Backend bağlantı hatası, sahte veriler yükleniyor:", error);
        // Eğer backend kapalıysa proje patlamasın, Zehra'nın sahte verileri görünsün
        setPosts(POSTS_DATA); 
      } finally {
        setLoading(false); // Yükleme bitti
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="flex gap-8 animate-fadeIn">
      
      {/* 1. ORTA PANEL: Ana Akış (Feed) */}
      <div className="flex-[1.8] min-w-0">
        
        {/* Üst Sekmeler (Tabs) */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-800 overflow-x-auto no-scrollbar sticky top-[116px] bg-[#0f1117] z-10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === tab 
                ? 'text-blue-500' 
                : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
              )}
            </button>
          ))}
        </div>

        {/* Gönderi Listesi */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700">
              <p className="text-blue-500 animate-pulse font-semibold">Veriler sunucudan çekiliyor...</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700">
              <p className="text-gray-500 italic">Henüz buralar çok ıssız, ilk postu sen at!</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. SAĞ PANEL: Trendler ve Öneriler */}
      <div className="hidden lg:block flex-1 max-w-[360px]">
        <div className="sticky top-[116px] flex flex-col gap-6">
          <TrendSidebar />
          <RecommendedTraders />
          
          {/* Footer Linkleri */}
          <div className="px-4 flex flex-wrap gap-x-3 gap-y-1">
            {['Hakkımızda', 'Yardım', 'Kullanım Şartları', 'Gizlilik Politikası', 'Çerezler'].map(link => (
              <span key={link} className="text-[11px] text-gray-600 hover:underline cursor-pointer">
                {link}
              </span>
            ))}
            <p className="text-[11px] text-gray-600 mt-2 w-full">© 2026 TradeIn Corp.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;