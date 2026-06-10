import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, UserX, Check, X, Save } from 'lucide-react';
import axios from 'axios';
import FeedCard from '../components/FeedCard';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useTheme, getThemeClasses } from '../context/ThemeContext';

const Profile = ({ isLoggedIn, setIsLoggedIn }) => {
  const { username } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !username;
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  const [activeTab, setActiveTab] = useState('Gönderilerim');
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [followModal, setFollowModal] = useState({
    isOpen: false,
    type: '', // 'followers' veya 'following'
    data: [],
    loading: false
  });

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setUserNotFound(false);
      try {
        const url = isOwnProfile ? 'http://127.0.0.1:8000/profilim' : `http://127.0.0.1:8000/kullanici/${username}`;
        const token = localStorage.getItem('tradein_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(url, { headers });
        if (!isOwnProfile && response.data.is_own_profile) { navigate('/profile', { replace: true }); return; }
        setProfileData(response.data);
        setEditName(response.data.name || '');
        setEditBio(response.data.bio || '');
        if (!isOwnProfile) setIsFollowed(response.data.is_following || false);
        setActiveTab('Gönderilerim');
      } catch (error) {
        if (error.response?.status === 401) { localStorage.removeItem('tradein_token'); window.location.href = '/login'; return; }
        if (!isOwnProfile) setUserNotFound(true);
      } finally { setIsLoading(false); }
    };
    fetchUserData();
  }, [username, isOwnProfile, navigate]);

  useEffect(() => {
    if (!profileData) return;
    if (activeTab === 'Gönderilerim') {
      setPosts((profileData.posts || []).map(p => ({
        id: p.id, content: p.content, likes: p.likes, comments: p.comments, tarih: p.tarih,
        time: new Date(p.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        isLiked: p.isLiked, user: { name: profileData.name || profileData.username.toUpperCase(), avatar: profileData.avatar }
      })));
    } else {
      const fetchLikedPosts = async () => {
        setLoadingPosts(true);
        try {
          const token = localStorage.getItem('tradein_token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const url = isOwnProfile ? 'http://127.0.0.1:8000/profilim/begendiklerim' : `http://127.0.0.1:8000/kullanici/${username}/begendiklerim`;
          const response = await axios.get(url, { headers });
          setPosts(response.data.map(p => ({
            id: p.post_id, content: p.icerik, likes: p.likes, comments: p.comments, tarih: p.tarih,
            time: new Date(p.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            isLiked: p.isLiked, user: { name: p.yazar, avatar: `https://ui-avatars.com/api/?name=${p.yazar}&background=random&color=fff` }
          })));
        } catch (error) { console.error(error); } finally { setLoadingPosts(false); }
      };
      fetchLikedPosts();
    }
  }, [activeTab, profileData, username, isOwnProfile]);

const handleLike = async (postId) => {
    const token = localStorage.getItem('tradein_token');
    if (!token) { alert('Beğenmek için giriş yapmalısınız!'); return; }
    
    // 🎯 TILSIM 1: Listeden tıklanan postun şu anki beğeni durumunu buluyoruz
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;
    
    // 🎯 TILSIM 2: Eğer zaten beğenildiyse false olacak, beğenilmediyse true olacak (Yerel Geçiş)
    const willBeLiked = !targetPost.isLiked; 

    try {
      // Backend'e isteği atıyoruz (Arka planda veritabanı tıkır tıkır güncelleniyor)
      await axios.post(`http://127.0.0.1:8000/post/${postId}/begen`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      // 🎯 TILSIM 3: Eğer "Beğendiklerim" sekmesindeysek ve beğeniyi geri aldıysak listeden anında uçur
      if (activeTab === 'Beğendiklerim' && !willBeLiked) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        return;
      }

      // 🎯 TILSIM 4: Backend'den ne döndüğüne (`response.data`) bakmaksızın state'imizi güvenle güncelliyoruz!
      setPosts(prev => prev.map(p => p.id === postId ? { 
        ...p, 
        likes: willBeLiked ? p.likes + 1 : Math.max(0, p.likes - 1), 
        isLiked: willBeLiked 
      } : p));

    } catch (error) { 
      console.error("Beğeni işlenirken hata oluştu:", error); 
    }
  };

  const handleFollow = async () => {
    const token = localStorage.getItem('tradein_token');
    if (!token) return;
    try {
      const response = await axios.post(`http://127.0.0.1:8000/takip-et/${profileData.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const isNowFollowing = response.data.mesaj.includes('Takip edildi');
      setIsFollowed(isNowFollowing);
      setProfileData(prev => ({ ...prev, followers: isNowFollowing ? prev.followers + 1 : prev.followers - 1 }));
    } catch (error) { console.error(error); }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('tradein_token');
    if (!token) return;
    try {
      await axios.put('http://127.0.0.1:8000/profilimi-guncelle', { name: editName, bio: editBio }, { headers: { Authorization: `Bearer ${token}` } });
      setProfileData(prev => ({ ...prev, name: editName, bio: editBio }));
      setIsEditingProfile(false);
    } catch (error) { console.error(error); }
  };

  const openFollowModal = async (type) => {
    setFollowModal({ isOpen: true, type, data: [], loading: true });
    try {
      const token = localStorage.getItem('tradein_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpointSuffix = type === 'followers' ? 'takipciler' : 'takip-edilenler';
      const url = isOwnProfile 
        ? `http://127.0.0.1:8000/profilim/${endpointSuffix}` 
        : `http://127.0.0.1:8000/kullanici/${username}/${endpointSuffix}`;

      const response = await axios.get(url, { headers });
      setFollowModal(prev => ({ ...prev, data: response.data, loading: false }));
    } catch (error) {
      console.error("Kullanıcı listesi çekilemedi:", error);
      setFollowModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUpdatePost = async () => {
    if (!editPostContent.trim()) return;
    const token = localStorage.getItem('tradein_token');
    try {
      await axios.put(`http://127.0.0.1:8000/post/${editingPost.id}`, { content: editPostContent }, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content: editPostContent } : p));
      setEditingPost(null);
    } catch (error) { console.error(error); }
  };

  // 🚀 GÜNCELLENDİ: Profildeki toplam gönderi sayısını da anlık olarak düşürüyor
const handleDeletePost = async (postId) => {
    const isConfirmed = window.confirm("Bu gönderiyi silmek istediğinize emin misiniz? (Tüm beğeni ve yorumlar da silinecektir)");
    if (!isConfirmed) return;

    const token = localStorage.getItem("tradein_token");
    if (!token) return;

    try {
      // 1. Backend'e silme isteği atılıyor
      await axios.delete(`http://127.0.0.1:8000/post/sil/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. 🎯 TILSIMLI DÜZELTME: profileData'yı güncellerken içindeki posts dizisinden de bu postu siliyoruz!
      setProfileData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          postsCount: Math.max(0, prev.postsCount - 1), // Sayacı 1 azalt
          posts: (prev.posts || []).filter(post => post.id !== postId) // 🚀 Gönderiyi ana kaynaktan da uçur!
        };
      });

      // 3. Mevcut posts listesini de anlık olarak filtrele
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      alert("Gönderi başarıyla silindi.");
    } catch (error) {
      console.error("Post silinirken hata oluştu:", error);
      alert("Gönderi silinirken bir hata oluştu.");
    }
  };

  const handleLogout = () => { localStorage.removeItem('tradein_token'); if (setIsLoggedIn) setIsLoggedIn(false); navigate('/login'); };

  if (isLoading) return (
    <div className={`flex-1 min-h-screen ${t.pageBg} ${t.textPrimary} flex items-center justify-center transition-colors duration-300`}>
      <p className="text-blue-500 animate-pulse font-semibold">Profil aranıyor...</p>
    </div>
  );

  if (userNotFound || !profileData) return (
    <div className={`flex-1 min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col items-center justify-center transition-colors duration-300`}>
      <div className={`${t.cardBg} border ${t.cardBorder} p-10 rounded-3xl flex flex-col items-center max-w-md text-center`}>
        <UserX size={40} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-black mb-2">Kullanıcı Bulunamadı</h2>
        <Link to="/" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold mt-4">Ana Sayfaya Dön</Link>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col transition-colors duration-300`}>
      <Navbar
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isLoggedIn={isLoggedIn || !!localStorage.getItem('tradein_token')}
        handleLogout={handleLogout}
        user={profileData ? { name: profileData.name } : null}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <div className="flex flex-1 w-full">
        <Sidebar isOpen={isSidebarOpen} isLoggedIn={isLoggedIn || !!localStorage.getItem('tradein_token')} setIsLoggedIn={setIsLoggedIn} />

        <div className="flex-1 pb-20 relative">
          <div className="max-w-4xl mx-auto pt-10 px-4">

            {/* Profil Başlık */}
            <header className={`flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-20 mb-6 border-b ${t.divider} pb-12`}>
              <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-full p-1 bg-gradient-to-tr from-blue-600 to-purple-600 mx-auto md:mx-0">
                <img src={profileData.avatar} alt="Avatar" className={`w-full h-full rounded-full border-4 ${theme === 'dark' ? 'border-[#0f1117]' : 'border-white'} object-cover`} />
              </div>

              <div className="flex-1 w-full text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-6">
                  <h2 className={`text-xl font-light ${t.textPrimary}`}>@{profileData.username?.replace(/^@/, '')}</h2>
                  {isOwnProfile ? (
                    isEditingProfile ? (
                      <div className="flex items-center gap-2">
                        <button onClick={handleSaveProfile} className="px-4 py-1.5 bg-green-600/20 text-green-500 border border-green-600/50 rounded-lg text-sm font-semibold hover:bg-green-600/30 flex items-center gap-1"><Check size={16} /> Kaydet</button>
                        <button onClick={() => { setIsEditingProfile(false); setEditName(profileData.name); setEditBio(profileData.bio); }} className={`px-4 py-1.5 ${t.deepCardBg} ${t.textSecond} border ${t.cardBorder} rounded-lg text-sm font-semibold flex items-center gap-1`}><X size={16} /> İptal</button>
                      </div>
                    ) : (
                      <button onClick={() => setIsEditingProfile(true)} className={`px-4 py-1.5 ${t.deepCardBg} border ${t.cardBorder} rounded-lg text-sm font-semibold ${t.hoverBg} ${t.textPrimary}`}>Profili Düzenle</button>
                    )
                  ) : (
                    <button onClick={handleFollow} className={`px-8 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${isFollowed ? `${t.deepCardBg} ${t.textSecond} border ${t.cardBorder}` : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                      {isFollowed ? <><UserCheck size={18} /> Takip Ediliyor</> : <><UserPlus size={18} /> Takip Et</>}
                    </button>
                  )}
                </div>

                <div className={`relative flex justify-center md:justify-start gap-10 mb-6 text-sm ${t.textPrimary}`}>
                  <span><strong>{profileData.postsCount}</strong> <span className={t.textSecond}>gönderi</span></span>
                  
                  <button onClick={() => openFollowModal('followers')} className={`hover:${t.textSecond} transition-colors focus:outline-none`}>
                    <strong>{profileData.followers?.toLocaleString('tr-TR')}</strong> <span className={t.textSecond}>takipçi</span>
                  </button>

                  <button onClick={() => openFollowModal('following')} className={`hover:${t.textSecond} transition-colors focus:outline-none`}>
                    <strong>{profileData.following?.toLocaleString('tr-TR')}</strong> <span className={t.textSecond}>takip</span>
                  </button>

                  {followModal?.isOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setFollowModal({ ...followModal, isOpen: false })} />
                      <div className={`absolute top-full left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 mt-2 w-64 md:w-72 max-h-[350px] flex flex-col ${t.modalBg} border ${t.cardBorder} rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                        <div className={`px-4 py-3 border-b ${t.divider} flex justify-between items-center bg-opacity-50`}>
                          <span className="text-xs font-black tracking-wider text-blue-500 uppercase">
                            {followModal.type === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
                          </span>
                          <button onClick={() => setFollowModal({ ...followModal, isOpen: false })} className={`p-1 ${t.textSecond} hover:text-red-500 rounded-md transition-colors`}>
                            <X size={14} />
                          </button>
                        </div>

                        <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
                          {followModal.loading ? (
                            <div className="text-center py-8 text-blue-500 animate-pulse text-sm font-medium">Kullanıcılar yükleniyor...</div>
                          ) : followModal.data.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {followModal.data.map((user, index) => (
                                <Link 
                                  key={index} 
                                  to={`/profile/${user.username}`} 
                                  onClick={() => setFollowModal({ ...followModal, isOpen: false })} 
                                  className={`flex items-center gap-3 p-2 rounded-xl hover:${t.hoverBg} transition-all`}
                                >
                                  <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username || 'U'}&background=random`} alt={user.username} className={`w-10 h-10 rounded-full object-cover border ${t.cardBorder}`} />
                                  <div className="flex flex-col overflow-hidden">
                                    <span className={`font-bold text-sm leading-tight truncate ${t.textPrimary}`}>{user.name || user.username}</span>
                                    <span className={`text-xs truncate ${t.textSecond}`}>@{user.username}</span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className={`text-center py-8 text-sm ${t.textMuted} italic`}>
                              {followModal.type === 'followers' ? 'Henüz takipçisi yok.' : 'Henüz kimseyi takip etmiyor.'}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {isOwnProfile && isEditingProfile ? (
                  <div className="w-full md:max-w-md mx-auto md:mx-0 mb-3">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                      className={`w-full ${t.deepCardBg} border border-blue-500 rounded-xl px-4 py-2 text-sm ${t.textPrimary} focus:outline-none`} placeholder="Adınız Soyadınız" />
                  </div>
                ) : <div className={`font-bold mb-2 ${t.textPrimary}`}>{profileData.name}</div>}

                {isOwnProfile && isEditingProfile ? (
                  <div className="w-full md:max-w-md mx-auto md:mx-0">
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)}
                      className={`w-full ${t.deepCardBg} border border-blue-500 rounded-xl p-3 text-sm ${t.textPrimary} resize-none`} rows="3" placeholder="Kendinden bahset..." />
                  </div>
                ) : <p className={`text-sm ${t.textSecond} max-w-md mx-auto md:mx-0 leading-relaxed whitespace-pre-wrap`}>{profileData.bio}</p>}
              </div>
            </header>

            {/* Sekmeler */}
            <div className={`flex items-center gap-2 mb-6 border-b ${t.divider} overflow-x-auto py-2`}>
              {['Gönderilerim', 'Beğendiklerim'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-blue-500' : `${t.textMuted} ${t.hoverText}`}`}>
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />}
                </button>
              ))}
            </div>

            {/* Gönderiler */}
            <div className="w-full flex flex-col gap-4">
              {loadingPosts ? (
                <div className="text-center py-10 text-blue-500 animate-pulse text-sm">Gönderiler yükleniyor...</div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <FeedCard 
                    key={post.id} 
                    post={post} 
                    onLike={handleLike}
                    // 🚀 GÜNCELLENDİ: Eğer kendi profilimizde ve "Gönderilerim" sekmesindeysek silme ve düzenleme fonksiyonlarını gönderiyoruz
                    onEdit={isOwnProfile && activeTab === 'Gönderilerim' ? () => { setEditingPost(post); setEditPostContent(post.content); } : null} 
                    onDelete={isOwnProfile && activeTab === 'Gönderilerim' ? handleDeletePost : null}
                  />
                ))
              ) : (
                <div className={`text-center py-20 ${t.deepCardBg} rounded-2xl border border-dashed ${t.cardBorder}`}>
                  <p className={`${t.textMuted} italic`}>
                    {activeTab === 'Gönderilerim' ? 'Henüz hiçbir paylaşım yapılmadı.' : 'Beğenilen hiçbir gönderi bulunmuyor.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Gönderi Düzenleme Modali */}
          {editingPost && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
              <div className={`${t.modalBg} border ${t.cardBorder} rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden`}>
                <div className={`px-6 py-4 border-b ${t.divider} flex items-center justify-between`}>
                  <h3 className="font-black text-xl tracking-tight text-blue-500">Gönderiyi Düzenle</h3>
                  <button onClick={() => setEditingPost(null)} className={`p-2 ${t.textSecond} ${t.hoverText}`}><X size={20} /></button>
                </div>
                <div className="p-6">
                  <textarea autoFocus value={editPostContent} onChange={e => setEditPostContent(e.target.value)}
                    className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-xl text-lg ${t.textPrimary} resize-none outline-none p-4 min-h-[150px] focus:border-blue-500`} />
                  <div className="flex justify-end pt-4 mt-4">
                    <button disabled={!editPostContent.trim() || editPostContent === editingPost.content} onClick={handleUpdatePost}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2">
                      <Save size={18} /> Değişiklikleri Kaydet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;