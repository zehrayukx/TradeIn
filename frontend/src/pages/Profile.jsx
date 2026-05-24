import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; 
import { UserPlus, UserCheck, UserX, Check, X, Save } from 'lucide-react';
import axios from 'axios';
import FeedCard from '../components/FeedCard'; 
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Profile = ({ isLoggedIn, setIsLoggedIn }) => {
  const { username } = useParams();
  const navigate = useNavigate(); 
  const isOwnProfile = !username; 
  
  // 🎯 YENİ: Profil içi sekmeler
  const [activeTab, setActiveTab] = useState('Gönderilerim');
  const [posts, setPosts] = useState([]); // Ekranda listelenecek dinamik postlar
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [isFollowed, setIsFollowed] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false); 

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Profil Verilerini İlk Yükleme Effect'i
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setUserNotFound(false); 
      try {
        const url = isOwnProfile ? 'http://127.0.0.1:8000/profilim' : `http://127.0.0.1:8000/kullanici/${username}`;
        const token = localStorage.getItem("tradein_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(url, { headers });

        if (!isOwnProfile && response.data.is_own_profile) {
          navigate('/profile', { replace: true }); 
          return;
        }

        setProfileData(response.data);
        setEditName(response.data.name || "");
        setEditBio(response.data.bio || "");
        if (!isOwnProfile) setIsFollowed(response.data.is_following || false);
        
        // İlk açılışta Gönderilerim sekmesini doldur
        setActiveTab('Gönderilerim');

      } catch (error) {
          if (error.response?.status === 401) {
              localStorage.removeItem("tradein_token");
              window.location.href = "/login"; 
              return;
          }
          if (!isOwnProfile) setUserNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [username, isOwnProfile, navigate]);

  // 🚀 SEKMEYE GÖRE GÖNDERİLERİ FİLTRELEYEN/ÇEKEN EFFECT
  useEffect(() => {
    if (!profileData) return;

    if (activeTab === 'Gönderilerim') {
      // Zaten profil veri paketinde gelen kullanıcının kendi postlarını map'le
      const formatted = (profileData.posts || []).map(p => ({
        id: p.id,
        content: p.content,
        likes: p.likes,
        comments: p.comments,
        tarih: p.tarih,
        time: new Date(p.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' }),
        isLiked: p.isLiked,
        user: {
          name: profileData.name || profileData.username.toUpperCase(),
          avatar: profileData.avatar
        }
      }));
      setPosts(formatted);
    } else {
      // Beğendiklerim sekmesi seçildiyse API'den taze verileri çek
      const fetchLikedPosts = async () => {
        setLoadingPosts(true);
        try {
          const token = localStorage.getItem("tradein_token");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const url = isOwnProfile 
            ? 'http://127.0.0.1:8000/profilim/begendiklerim' 
            : `http://127.0.0.1:8000/kullanici/${username}/begendiklerim`;
          
          const response = await axios.get(url, { headers });
          const formatted = response.data.map(p => ({
            id: p.post_id,
            content: p.icerik,
            likes: p.likes,
            comments: p.comments,
            tarih: p.tarih,
            time: new Date(p.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' }),
            isLiked: p.isLiked,
            user: {
              name: p.yazar,
              avatar: `https://ui-avatars.com/api/?name=${p.yazar}&background=random&color=fff`
            }
          }));
          setPosts(formatted);
        } catch (error) {
          console.error("Beğenilen postlar çekilemedi:", error);
        } finally {
          setLoadingPosts(false);
        }
      };
      fetchLikedPosts();
    }
  }, [activeTab, profileData, username, isOwnProfile]);

  const handleLike = async (postId) => {
    const token = localStorage.getItem("tradein_token");
    if (!token) { alert("Beğenmek için giriş yapmalısınız!"); return; }
    try {
      const response = await axios.post(`http://127.0.0.1:8000/post/${postId}/begen`, {}, { headers: { Authorization: `Bearer ${token}` } });
      
      // Eğer Beğendiklerim sekmesindeysek ve beğeniyi geri aldıysak listeden anlık düşürelim
      if (activeTab === 'Beğendiklerim' && !response.data.begenildi) {
        setPosts(prev => prev.filter(post => post.id !== postId));
        return;
      }

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
    } catch (error) { console.error("Beğeni hatası:", error); }
  };

  const handleFollow = async () => {
    const token = localStorage.getItem("tradein_token");
    if (!token) return;
    try {
      const response = await axios.post(`http://127.0.0.1:8000/takip-et/${profileData.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const isNowFollowing = response.data.mesaj.includes("takip edildi");
      setIsFollowed(isNowFollowing);
      setProfileData(prev => ({ ...prev, followers: isNowFollowing ? prev.followers + 1 : prev.followers - 1 }));
    } catch (error) { console.error(error); }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("tradein_token");
    if (!token) return;
    try {
      await axios.put('http://127.0.0.1:8000/profilimi-guncelle', { name: editName, bio: editBio }, { headers: { Authorization: `Bearer ${token}` } });
      setProfileData(prev => ({ ...prev, name: editName, bio: editBio }));
      setIsEditingProfile(false);
    } catch (error) { console.error(error); }
  };

  const handleUpdatePost = async () => {
    if (!editPostContent.trim()) return;
    const token = localStorage.getItem("tradein_token");
    try {
      await axios.put(`http://127.0.0.1:8000/post/${editingPost.id}`, { content: editPostContent }, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content: editPostContent } : p));
      setEditingPost(null); 
    } catch (error) { console.error(error); }
  };

  if (isLoading) return <div className="flex-1 min-h-screen bg-[#0f1117] text-white flex items-center justify-center pb-20"><p className="text-blue-500 animate-pulse font-semibold">Profil aranıyor...</p></div>;
  if (userNotFound || !profileData) return <div className="flex-1 min-h-screen bg-[#0f1117] text-white flex flex-col items-center justify-center pb-20"><div className="bg-[#1a1d26] border border-gray-800 p-10 rounded-3xl flex flex-col items-center max-w-md text-center"><UserX size={40} className="text-red-500 mb-6" /><h2 className="text-2xl font-black mb-2">Kullanıcı Bulunamadı</h2><Link to="/" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold mt-4">Ana Sayfaya Dön</Link></div></div>;

  const handleLogout = () => {
    localStorage.removeItem("tradein_token");
    if (setIsLoggedIn) setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white flex flex-col">
      <Navbar
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isLoggedIn={isLoggedIn || !!localStorage.getItem("tradein_token")}
        handleLogout={handleLogout}
        user={profileData ? { name: profileData.name } : null}
        searchQuery=""
        setSearchQuery={() => {}}
      />
      <div className="flex flex-1 w-full">
        <Sidebar
          isOpen={isSidebarOpen}
          isLoggedIn={isLoggedIn || !!localStorage.getItem("tradein_token")}
          setIsLoggedIn={setIsLoggedIn}
        />
      <div className="flex-1 pb-20 relative">
      <div className="max-w-4xl mx-auto pt-10 px-4">
        {/* Üst Profil Kartı Bölümü */}
        <header className="flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-20 mb-6 border-b border-gray-800 pb-12">
          <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-full p-1 bg-gradient-to-tr from-blue-600 to-purple-600 mx-auto md:mx-0">
            <img src={profileData.avatar} alt="Avatar" className="w-full h-full rounded-full border-4 border-[#0f1117] object-cover" />
          </div>
          
          <div className="flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-6">
              <h2 className="text-xl font-light">{profileData.username}</h2>
              {isOwnProfile ? (
                isEditingProfile ? (
                  <div className="flex items-center gap-2">
                    <button onClick={handleSaveProfile} className="px-4 py-1.5 bg-green-600/20 text-green-500 border border-green-600/50 rounded-lg text-sm font-semibold hover:bg-green-600/30 flex items-center gap-1"><Check size={16} /> Kaydet</button>
                    <button onClick={() => { setIsEditingProfile(false); setEditName(profileData.name); setEditBio(profileData.bio); }} className="px-4 py-1.5 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg text-sm font-semibold flex items-center gap-1"><X size={16} /> İptal</button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditingProfile(true)} className="px-4 py-1.5 bg-[#1a1d26] border border-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-800">Profili Düzenle</button>
                )
              ) : (
                <button onClick={handleFollow} className={`px-8 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${isFollowed ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-blue-600 text-white'}`}>
                  {isFollowed ? <><UserCheck size={18} /> Takip Ediliyor</> : <><UserPlus size={18} /> Takip Et</>}
                </button>
              )}
            </div>
            
            <div className="flex justify-center md:justify-start gap-10 mb-6 text-sm">
              <span><strong>{profileData.postsCount}</strong> gönderi</span>
              <span><strong>{profileData.followers.toLocaleString('tr-TR')}</strong> takipçi</span>
              <span><strong>{profileData.following.toLocaleString('tr-TR')}</strong> takip</span>
            </div>
            
            {isOwnProfile && isEditingProfile ? (
              <div className="w-full md:max-w-md mx-auto md:mx-0 mb-3"><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-[#1a1d26] border border-blue-500 rounded-xl px-4 py-2 text-sm text-white focus:outline-none" placeholder="Adınız Soyadınız" /></div>
            ) : (<div className="font-bold mb-2">{profileData.name}</div>)}
            
            {isOwnProfile && isEditingProfile ? (
              <div className="w-full md:max-w-md mx-auto md:mx-0"><textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-[#1a1d26] border border-blue-500 rounded-xl p-3 text-sm text-white resize-none" rows="3" placeholder="Kendinden bahset..." /></div>
            ) : (<p className="text-sm text-gray-300 max-w-md mx-auto md:mx-0 leading-relaxed whitespace-pre-wrap">{profileData.bio}</p>)}
          </div>
        </header>

        {/* 🎯 YENİ: PROFİL İÇİ SEKMELER BARBARI */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-800 overflow-x-auto no-scrollbar py-2">
          {['Gönderilerim', 'Beğendiklerim'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === tab ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
              )}
            </button>
          ))}
        </div>

        {/* Gönderiler Alanı */}
        <div className="w-full flex flex-col gap-4">
          {loadingPosts ? (
            <div className="text-center py-10 text-blue-500 animate-pulse text-sm">Gönderiler yükleniyor...</div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <FeedCard 
                key={post.id} 
                post={post} 
                onLike={handleLike} 
                // Yalnızca "Gönderilerim" sekmesindeysek ve kendi profilimizse düzenleme ikonunu göster
                onEdit={isOwnProfile && activeTab === 'Gönderilerim' ? () => { setEditingPost(post); setEditPostContent(post.content); } : null}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700">
              <p className="text-gray-500 italic">
                {activeTab === 'Gönderilerim' ? 'Henüz hiçbir paylaşım yapılmadı.' : 'Beğenilen hiçbir gönderi bulunmuyor.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* GÖNDERİ DÜZENLEME MODALI */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#1a1d26] border border-gray-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-xl tracking-tight text-blue-500">Gönderiyi Düzenle</h3>
              <button onClick={() => setEditingPost(null)} className="p-2 text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6">
              <textarea autoFocus value={editPostContent} onChange={(e) => setEditPostContent(e.target.value)} className="w-full bg-[#0a0f1d] border border-gray-700 rounded-xl text-lg text-white resize-none outline-none p-4 min-h-[150px]" />
              <div className="flex justify-end pt-4 mt-4">
                <button disabled={!editPostContent.trim() || editPostContent === editingPost.content} onClick={handleUpdatePost} className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2"><Save size={18} /> Değişiklikleri Kaydet</button>
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