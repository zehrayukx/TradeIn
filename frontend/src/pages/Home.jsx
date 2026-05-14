import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { POSTS_DATA } from '../data/mockData';
import FeedCard from '../components/FeedCard';
import TrendSidebar from '../components/TrendSidebar';
import RecommendedTraders from '../components/RecommendedTraders';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Home = ({ isLoggedIn, setIsLoggedIn }) => {
  const [activeTab, setActiveTab] = useState('Trendler');
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const tabs = ['Trendler', 'Borsa', 'Altın', 'Gümüş', 'Kripto'];

  // EKLENEN KISIM: Gerçek beğeni fonksiyonu
    const handleLike = async (postId) => {
    const token = localStorage.getItem("tradein_token");
    if (!token) {
      alert("Gönderileri beğenmek için önce giriş yapmalısınız!");
      return;
    }

    try {
      const response = await axios.post(`http://127.0.0.1:8000/post/${postId}/begen`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              // Backend 'begenildi' true döndüyse sayıyı 1 artır, false ise 1 azalt
              likes: response.data.begenildi ? post.likes + 1 : Math.max(0, post.likes - 1),
              // YENİ: Beğeni durumunu da tersine çeviriyoruz (Tıklandıkça Kırmızı/Gri değişimi)
              isLiked: response.data.begenildi 
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Beğeni işlemi sırasında hata oluştu:", error);
    }
  };

  useEffect(() => {
      const fetchPosts = async () => {
        try {
          // YENİ: Token varsa başlıkta gönderiyoruz ki backend bizim kim olduğumuzu anlasın
          const token = localStorage.getItem("tradein_token");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          const response = await axios.get('http://127.0.0.1:8000/populer-postlar', { headers });
          
          const gercekVeriler = response.data.map((post) => ({
            id: post.post_id,
            user: { 
              name: post.yazar, 
              avatar: `https://ui-avatars.com/api/?name=${post.yazar}&background=random&color=fff`, 
              isVerified: false 
            },
            content: post.icerik,
            time: new Date(post.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' }),
            likes: post.likes, 
            comments: post.comments,
            isLiked: post.isLiked, // YENİ: Backend'den gelen beğeni durumunu al
            isFollowed: false
          }));

          setPosts(gercekVeriler); 
        } catch (error) {
          console.error("Backend bağlantı hatası, sahte veriler yükleniyor:", error);
          setPosts(POSTS_DATA); 
        } finally {
          setLoading(false); 
        }
      };

      fetchPosts();
    }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col">
      
      {/* 2. NAVBAR'A YETKİ VERİYORUZ: Butona basınca isSidebarOpen'ı tam tersine çevir */}
      <Navbar 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isLoggedIn={isLoggedIn} 
      />

      {/* 3. ANA İSKELET: Grid yerine Flex kullanıyoruz ki menü kayarak açılabilsin */}
      <div className="flex flex-1 max-w-[1440px] w-full mx-auto">
        
        {/* SOL PANEL: Sidebar'a açık mı kapalı mı olduğunu bildiriyoruz */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          isLoggedIn={isLoggedIn} 
          setIsLoggedIn={setIsLoggedIn} 
        />

        {/* ORTA PANEL: Ana Akış (Feed) */}
        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          
          {/* Üst Sekmeler (Tabs) */}
          <div className="flex items-center gap-2 mb-6 border-b border-gray-800 overflow-x-auto no-scrollbar sticky top-[80px] bg-[#0a0f1d] z-10 py-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${
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
                // EKLENEN KISIM: onLike prop'unu FeedCard'a gönderiyoruz
                <FeedCard key={post.id} post={post} onLike={handleLike} />
              ))
            ) : (
              <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700">
                <p className="text-gray-500 italic">Henüz buralar çok ıssız, ilk postu sen at!</p>
              </div>
            )}
          </div>
        </main>

        {/* SAĞ PANEL: Trendler ve Öneriler */}
        <aside className="w-[300px] hidden lg:block py-6 pr-6 shrink-0">
          <div className="sticky top-[80px] flex flex-col gap-6">
            <TrendSidebar />
            <RecommendedTraders />
            
            <div className="px-4 flex flex-wrap gap-x-3 gap-y-1">
              {['Hakkımızda', 'Yardım', 'Kullanım Şartları', 'Gizlilik Politikası', 'Çerezler'].map(link => (
                <span key={link} className="text-[11px] text-gray-600 hover:underline cursor-pointer">
                  {link}
                </span>
              ))}
              <p className="text-[11px] text-gray-600 mt-2 w-full">© 2026 TradeIn Corp.</p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Home;