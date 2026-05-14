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
  const [activeTab, setActiveTab] = useState('Trendler');
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const tabs = ['Trendler', 'Borsa', 'Altın', 'Gümüş', 'Kripto'];

  const handleLogout = () => {
    localStorage.removeItem("tradein_token");
    setIsLoggedIn(false);
  };

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
      console.error("Beğeni işlemi sırasında hata oluştu:", error);
      if (error.response?.status === 401) {
        setShowAuthModal(true);
      }
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // 🎯 RADİKAL ÇÖZÜM: Eğer giriş yapılmadıysa token'ı hiç okuma, doğrudan null yap!
        const token = isLoggedIn ? localStorage.getItem("tradein_token") : null;
        const validToken = token && token !== "undefined" && token !== "null";
        const headers = validToken ? { Authorization: `Bearer ${token}` } : {};

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
          // 🎯 ASIL KİLİT NOKTA: Kullanıcı çıkış yapmışsa backend verisi ne olursa olsun 'false' bas!
          isLiked: isLoggedIn ? post.isLiked : false, 
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
  }, [isLoggedIn]); // Hem giriş hem çıkış anında bu güvenli filtre tetiklenir

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col relative">
      
      <Navbar 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isLoggedIn={isLoggedIn} 
        handleLogout={handleLogout}
      />

      <div className="flex flex-1 max-w-[1440px] w-full mx-auto">
        
        <Sidebar 
          isOpen={isSidebarOpen} 
          isLoggedIn={isLoggedIn} 
          setIsLoggedIn={setIsLoggedIn} 
        />

        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          
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

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700">
                <p className="text-blue-500 animate-pulse font-semibold">Veriler sunucudan çekiliyor...</p>
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <FeedCard key={post.id} post={post} onLike={handleLike} />
              ))
            ) : (
              <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700">
                <p className="text-gray-500 italic">Henüz buralar çok ıssız, ilk postu sen at!</p>
              </div>
            )}
          </div>
        </main>

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

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200">
          <div className="bg-[#1a1d26] border border-gray-800 rounded-2xl max-w-sm w-full p-6 relative shadow-2xl">
            
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="text-center mt-3">
              <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={22} className="fill-blue-500/20" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">TradeIn Topluluğuna Katılın</h3>
              <p className="text-xs text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                Bu gönderiyi beğenmek ve diğer traderlar ile etkileşime girmek için bir hesabınız olmalı.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mt-6">
              <Link 
                to="/login"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-center transition-colors text-sm"
              >
                Giriş Yap
              </Link>
              <Link 
                to="/register"
                className="w-full bg-[#242936] hover:bg-[#2e3445] text-white border border-gray-700 font-bold py-2 rounded-xl text-center transition-colors text-sm"
              >
                Hesap Oluştur (Üye Ol)
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Home;