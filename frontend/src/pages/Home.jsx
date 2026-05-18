import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; 
import { X, Heart } from 'lucide-react'; 
import { POSTS_DATA } from '../data/mockData';
import FeedCard from '../components/FeedCard';
import TrendSidebar from '../components/TrendSidebar';
import RecommendedTraders from '../components/RecommendedTraders';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Home = ({ isLoggedIn, setIsLoggedIn }) => {
  // 🎯 DİNAMİK SEKMELER: Giriş durumuna göre dizilim değişiyor
  const tabs = isLoggedIn 
    ? ['Takip Ettiklerim', 'Trendler', 'Borsa', 'Altın', 'Gümüş', 'Kripto']
    : ['Trendler', 'Borsa', 'Altın', 'Gümüş', 'Kripto'];

  // Giriş durumuna göre varsayılan aktif sekmeyi belirliyoruz
  const [activeTab, setActiveTab] = useState(isLoggedIn ? 'Takip Ettiklerim' : 'Trendler');
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("tradein_token");
    setIsLoggedIn(false);
    setUser(null);
  };

  // Kullanıcı giriş/çıkış yaptığında aktif sekmeyi otomatik olarak doğru varsayılana eşitle
  useEffect(() => {
    setActiveTab(isLoggedIn ? 'Takip Ettiklerim' : 'Trendler');
  }, [isLoggedIn]);

  const handleLike = async (postId) => {
    const token = localStorage.getItem("tradein_token");
    if (!isLoggedIn || !token || token === "undefined" || token === "null") {
      setShowAuthModal(true);
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
              likes: response.data.begenildi ? post.likes + 1 : Math.max(0, post.likes - 1),
              isLiked: response.data.begenildi 
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Beğeni hatası:", error);
      if (error.response?.status === 401) setShowAuthModal(true);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("tradein_token");
    const validToken = token && token !== "undefined" && token !== "null";

    const fetchUserData = async () => {
      if (isLoggedIn && validToken) {
        try {
          const response = await axios.get('http://127.0.0.1:8000/profilim', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser({ name: response.data.name }); 
        } catch (error) {
          console.error("Kullanıcı verisi çekilemedi:", error);
        }
      }
    };
    fetchUserData();
  }, [isLoggedIn]);

  // 🚀 SEKMEYE GÖRE GÖNDERİLERİ ÇEKEN EFFECT
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("tradein_token");
        const validToken = token && token !== "undefined" && token !== "null";
        const headers = validToken ? { Authorization: `Bearer ${token}` } : {};

        // 🎯 DİNAMİK URL SEÇİMİ
        let url = 'http://127.0.0.1:8000/populer-postlar'; // Varsayılan Trendler
        if (activeTab === 'Takip Ettiklerim') {
          url = 'http://127.0.0.1:8000/akis';
        }

        // Borsa, Altın vb. diğer henüz boş sekmeler için koruma mantığı
        if (activeTab !== 'Takip Ettiklerim' && activeTab !== 'Trendler') {
          setPosts([]);
          setLoading(false);
          return;
        }

        const response = await axios.get(url, { headers });
        
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
          isLiked: isLoggedIn ? post.isLiked : false,
          isFollowed: false
        }));
        setPosts(gercekVeriler); 
      } catch (error) {
        console.error("Post çekme hatası:", error);
        setPosts(POSTS_DATA); 
      } finally {
        setLoading(false); 
      }
    };

    fetchPosts();
  }, [activeTab, isLoggedIn]); // Sekme değiştiğinde veya giriş durumu değiştiğinde tetiklenir

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col relative">
      
      <Navbar 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isLoggedIn={isLoggedIn} 
        handleLogout={handleLogout}
        user={user} 
      />

      <div className="flex flex-1 max-w-[1440px] w-full mx-auto">
        <Sidebar 
          isOpen={isSidebarOpen} 
          isLoggedIn={isLoggedIn} 
          setIsLoggedIn={setIsLoggedIn} 
        />

        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          
          {/* Dinamik Sekmeler Alanı */}
          <div className="flex items-center gap-2 mb-6 border-b border-gray-800 overflow-x-auto no-scrollbar sticky top-[80px] bg-[#0a0f1d] z-10 py-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${
                  activeTab === tab ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />}
              </button>
            ))}
          </div>

          {/* Gönderi Listesi */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700 text-blue-500 animate-pulse">
                Veriler sunucudan çekiliyor...
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <FeedCard key={post.id} post={post} onLike={handleLike} />
              ))
            ) : (
              <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700">
                <p className="text-gray-500 italic">
                  {activeTab === 'Takip Ettiklerim' 
                    ? 'Takip ettiğin kimse henüz paylaşım yapmadı veya kimseyi takip etmiyorsun. Trendlere göz atmaya ne dersin?' 
                    : 'Henüz buralar çok ıssız, ilk postu sen at!'}
                </p>
              </div>
            )}
          </div>
        </main>

        <aside className="w-[300px] hidden lg:block py-6 pr-6 shrink-0">
          <div className="sticky top-[80px] flex flex-col gap-6">
            <TrendSidebar />
            <RecommendedTraders />
          </div>
        </aside>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d26] border border-gray-800 rounded-2xl max-w-sm w-full p-6 relative shadow-2xl text-center">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
            <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"><Heart size={22} className="fill-blue-500/20" /></div>
            <h3 className="text-lg font-bold text-white mb-2">TradeIn Topluluğuna Katılın</h3>
            <p className="text-xs text-gray-400 mb-6">Etkileşime girmek için bir hesabınız olmalı.</p>
            <div className="flex flex-col gap-2">
              <Link to="/login" className="bg-blue-600 py-2 rounded-xl text-white font-bold text-sm">Giriş Yap</Link>
              <Link to="/register" className="bg-[#242936] py-2 rounded-xl text-white border border-gray-700 font-bold text-sm">Üye Ol</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;