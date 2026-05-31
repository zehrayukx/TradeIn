import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { X, Heart, Send, Image as ImageIcon } from 'lucide-react';
import FeedCard from '../components/FeedCard';
import TrendSidebar from '../components/TrendSidebar';
import RecommendedTraders from '../components/RecommendedTraders';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useTheme, getThemeClasses } from '../context/ThemeContext';

const Home = ({ isLoggedIn, setIsLoggedIn }) => {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs = isLoggedIn
    ? ['Trendler', 'Takip Edilenler', 'Borsa', 'Altın', 'Gümüş', 'Bitcoin', 'Dolar', 'Euro', 'Sterlin']
    : ['Trendler', 'Borsa', 'Altın', 'Gümüş', 'Bitcoin', 'Dolar', 'Euro', 'Sterlin'];

  const [activeTab, setActiveTab] = useState(isLoggedIn ? 'Takip Edilenler' : 'Trendler');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("tradein_token");
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab !== 'Trendler' && tab !== 'Takip Edilenler') {
      setSearchQuery(tab);
    } else {
      setSearchQuery("");
    }
  };

  const handleTrendSidebarClick = (hashtag) => {
    setSearchQuery(hashtag);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tabs.includes(hashtag)) {
      setActiveTab(hashtag);
    } else {
      setActiveTab('Trendler');
    }
  };

  const handleLike = async (postId) => {
    const token = localStorage.getItem("tradein_token");
    if (!token) { setShowAuthModal(true); return; }
    try {
      const response = await axios.post(`http://127.0.0.1:8000/post/${postId}/begen`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(prev => prev.map(post => post.id === postId ? { ...post, likes: response.data.begenildi ? post.likes + 1 : Math.max(0, post.likes - 1), isLiked: response.data.begenildi } : post));
    } catch (error) { console.error("Beğeni hatası:", error); }
  };

  const handlePublishPost = async () => {
    if (!newPostContent.trim()) return;
    const token = localStorage.getItem("tradein_token");
    setIsPublishing(true);
    try {
      await axios.post('http://127.0.0.1:8000/post-olustur', { content: newPostContent, media_url: "" }, { headers: { Authorization: `Bearer ${token}` } });
      setNewPostContent("");
      setShowCreateModal(false);
      setSearchQuery("");
      setActiveTab(isLoggedIn ? 'Takip Edilenler' : 'Trendler');
    } catch (error) { console.error(error); } finally { setIsPublishing(false); }
  };

  // Bu fonksiyon tetiklendiğinde sayfa arkadan postları güncelleyecek
  const handleFollowUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("tradein_token");
        const headers = token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};
        let url = 'http://127.0.0.1:8000/populer-postlar';
        if (searchQuery) {
          url = `http://127.0.0.1:8000/populer-postlar?hashtag=${searchQuery}`;
        } else if (activeTab === 'Takip Edilenler') {
          url = 'http://127.0.0.1:8000/akis';
        }
        const response = await axios.get(url, { headers });
        const gercekVeriler = response.data.map((post) => ({
          id: post.post_id,
          user: { name: post.yazar, avatar: `https://ui-avatars.com/api/?name=${post.yazar}&background=random&color=fff`, isVerified: false },
          content: post.icerik,
          time: new Date(post.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          likes: post.likes, comments: post.comments, isLiked: isLoggedIn ? post.isLiked : false,
        }));
        setPosts(gercekVeriler);
      } catch (error) { setPosts([]); } finally { setLoading(false); }
    };
    fetchPosts();
  }, [activeTab, isLoggedIn, searchQuery, refreshTrigger]); // refreshTrigger eklendi

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("tradein_token");
      if (isLoggedIn && token) {
        try {
          const response = await axios.get('http://127.0.0.1:8000/profilim', { headers: { Authorization: `Bearer ${token}` } });
          setUser({ name: response.data.name });
        } catch (error) { console.error(error); }
      }
    };
    fetchUserData();
  }, [isLoggedIn]);

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col relative transition-colors duration-300`}>
      <Navbar
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        user={user}
        openCreatePost={() => setShowCreateModal(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex flex-1 w-full">
        <Sidebar isOpen={isSidebarOpen} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          <div className={`flex items-center gap-3 mb-6 flex-wrap sticky top-[80px] ${t.pageBg} z-10 py-3 transition-colors duration-300`}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : `${t.cardBg2} ${t.textSecond} ${t.hoverBg} ${t.hoverText} border ${t.cardBorder}`
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className={`text-center py-20 ${t.cardBg} rounded-2xl border border-dashed ${t.cardBorder} text-blue-500 animate-pulse`}>
                Veriler çekiliyor...
              </div>
            ) : posts.length > 0 ? (
              <>
                {searchQuery && (
                  <div className="bg-blue-900/20 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-xl mb-2 flex items-center justify-between">
                    <span className="font-semibold">"{searchQuery}" için sonuçlar gösteriliyor</span>
                    <button onClick={() => { setSearchQuery(""); setActiveTab('Trendler'); }} className="text-sm underline hover:text-blue-300">Aramayı Temizle</button>
                  </div>
                )}
                {posts.map((post) => <FeedCard key={post.id} post={post} onLike={handleLike} />)}
              </>
            ) : (
              <div className={`text-center py-20 ${t.cardBg} rounded-2xl border border-dashed ${t.cardBorder}`}>
                <p className={`${t.textSecond} italic`}>
                  {searchQuery ? `"${searchQuery}" içeren hiçbir gönderi bulunamadı.` : 'Buralar biraz ıssız...'}
                </p>
              </div>
            )}
          </div>
        </main>

        <aside className="w-[300px] hidden lg:block py-6 pr-6 shrink-0">
          <TrendSidebar onTrendClick={handleTrendSidebarClick} />
          {/* SİHRİN GERÇEKLEŞTİĞİ YER: Prop olarak fırlatıyoruz */}
          <RecommendedTraders onFollowUpdate={handleFollowUpdate} />
        </aside>
      </div>

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className={`${t.cardBg} border ${t.cardBorder} rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${t.divider} flex items-center justify-between`}>
              <h3 className={`font-black text-xl tracking-tight ${t.textPrimary}`}>Yeni Gönderi</h3>
              <button onClick={() => setShowCreateModal(false)} className={`p-2 ${t.hoverBg} rounded-full transition-colors ${t.textSecond} ${t.hoverText}`}><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="flex gap-4">
                <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&color=fff`} className="w-12 h-12 rounded-full border border-gray-300" alt="Avatar" />
                <div className="flex-1">
                  <textarea
                    autoFocus
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Piyasalarda neler oluyor?"
                    className={`w-full bg-transparent border-none text-lg ${t.textPrimary} placeholder-gray-400 resize-none outline-none min-h-[150px] py-2`}
                  />
                  <div className={`flex items-center justify-between pt-4 border-t ${t.divider} mt-4`}>
                    <div className="flex gap-2"><button className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"><ImageIcon size={20} /></button></div>
                    <button
                      disabled={!newPostContent.trim() || isPublishing}
                      onClick={handlePublishPost}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400 disabled:text-gray-200 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
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

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${t.cardBg} border ${t.cardBorder} rounded-2xl max-w-sm w-full p-6 relative shadow-2xl text-center`}>
            <button onClick={() => setShowAuthModal(false)} className={`absolute top-4 right-4 ${t.textSecond} ${t.hoverText}`}><X size={18} /></button>
            <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"><Heart size={22} className="fill-blue-500/20" /></div>
            <h3 className={`text-lg font-bold ${t.textPrimary} mb-2`}>TradeIn Topluluğuna Katılın</h3>
            <p className={`text-xs ${t.textSecond} mb-6`}>Etkileşime girmek için bir hesabınız olmalı.</p>
            <div className="flex flex-col gap-2">
              <Link to="/login" className="bg-blue-600 py-2 rounded-xl text-white font-bold text-sm">Giriş Yap</Link>
              <Link to="/register" className={`${t.cardBg2} py-2 rounded-xl ${t.textPrimary} border ${t.cardBorder} font-bold text-sm`}>Üye Ol</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;