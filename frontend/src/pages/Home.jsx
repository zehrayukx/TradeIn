import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; 
import { X, Heart, Plus, Send, Image as ImageIcon } from 'lucide-react'; 
import { POSTS_DATA } from '../data/mockData';
import FeedCard from '../components/FeedCard';
import TrendSidebar from '../components/TrendSidebar';
import RecommendedTraders from '../components/RecommendedTraders';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Home = ({ isLoggedIn, setIsLoggedIn }) => {
  const tabs = isLoggedIn 
    ? ['Takip Ettiklerim', 'Trendler', 'Borsa', 'Altın', 'Gümüş', 'Kripto']
    : ['Trendler', 'Borsa', 'Altın', 'Gümüş', 'Kripto'];

  const [activeTab, setActiveTab] = useState(isLoggedIn ? 'Takip Ettiklerim' : 'Trendler');
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // 🎯 YENİ: Gönderi Oluşturma State'leri
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const [user, setUser] = useState(null);

  // Sayfayı yenileme fonksiyonu (Post atınca otomatik tazelemek için)
  const refreshFeed = () => {
    setActiveTab(isLoggedIn ? 'Takip Ettiklerim' : 'Trendler');
    fetchPosts();
  };

  const handleLogout = () => {
    localStorage.removeItem("tradein_token");
    setIsLoggedIn(false);
    setUser(null);
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
      console.error("Beğeni hatası:", error);
    }
  };

  // 🚀 YENİ: GÖNDERİ PAYLAŞMA FONKSİYONU
  const handlePublishPost = async () => {
    if (!newPostContent.trim()) return;
    const token = localStorage.getItem("tradein_token");
    
    setIsPublishing(true);
    try {
      await axios.post('http://127.0.0.1:8000/post-olustur', 
        { content: newPostContent, media_url: "" }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewPostContent("");
      setShowCreateModal(false);
      fetchPosts(); // Akışı anında tazele
    } catch (error) {
      console.error("Post paylaşma hatası:", error);
      alert("Gönderi paylaşılırken bir hata oluştu.");
    } finally {
      setIsPublishing(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("tradein_token");
      const validToken = token && token !== "undefined" && token !== "null";
      const headers = validToken ? { Authorization: `Bearer ${token}` } : {};

      let url = 'http://127.0.0.1:8000/populer-postlar';
      if (activeTab === 'Takip Ettiklerim') url = 'http://127.0.0.1:8000/akis';

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
      }));
      setPosts(gercekVeriler); 
    } catch (error) {
      console.error("Post çekme hatası:", error);
      setPosts([]); 
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("tradein_token");
      if (isLoggedIn && token) {
        try {
          const response = await axios.get('http://127.0.0.1:8000/profilim', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser({ name: response.data.name }); 
        } catch (error) { console.error(error); }
      }
    };
    fetchUserData();
    fetchPosts();
  }, [activeTab, isLoggedIn]);

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col relative">
      
      <Navbar 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isLoggedIn={isLoggedIn} 
        handleLogout={handleLogout}
        user={user}
        openCreatePost={() => setShowCreateModal(true)} // Navbar'daki butona yetki ver
      />

      <div className="flex flex-1 max-w-[1440px] w-full mx-auto">
        <Sidebar isOpen={isSidebarOpen} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-800 overflow-x-auto no-scrollbar sticky top-[80px] bg-[#0a0f1d] z-10 py-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700 text-blue-500 animate-pulse">Veriler çekiliyor...</div>
            ) : posts.length > 0 ? (
              posts.map((post) => <FeedCard key={post.id} post={post} onLike={handleLike} />)
            ) : (
              <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700 text-gray-500 italic">Buralar biraz ıssız...</div>
            )}
          </div>
        </main>

        <aside className="w-[300px] hidden lg:block py-6 pr-6 shrink-0">
          <TrendSidebar />
          <RecommendedTraders />
        </aside>
      </div>

      {/* 🚀 GÖNDERİ OLUŞTURMA MODALI (POP-UP) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 transition-all">
          <div className="bg-[#1a1d26] border border-gray-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-xl tracking-tight">Yeni Gönderi</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex gap-4">
                <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&color=fff`} className="w-12 h-12 rounded-full border border-gray-700" alt="Avatar" />
                <div className="flex-1">
                  <textarea
                    autoFocus
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Piyasalarda neler oluyor?"
                    className="w-full bg-transparent border-none text-lg text-white placeholder-gray-600 resize-none outline-none min-h-[150px] py-2"
                  />
                  
                  {/* Araç Çubuğu */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800/50 mt-4">
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                        <ImageIcon size={20} />
                      </button>
                    </div>
                    
                    <button 
                      disabled={!newPostContent.trim() || isPublishing}
                      onClick={handlePublishPost}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      {isPublishing ? 'Yayınlanıyor...' : <><Send size={18} /> Paylaş</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal (Giriş Yap uyarısı) aynı kalsın... */}
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