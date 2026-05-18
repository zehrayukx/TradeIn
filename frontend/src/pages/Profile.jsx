import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserPlus, UserCheck, UserX, Check, X, Save } from 'lucide-react';
import axios from 'axios';
import FeedCard from '../components/FeedCard'; // 🎯 YENİ: Akıllı kartımızı çağırdık

const Profile = () => {
  const { username } = useParams();
  const isOwnProfile = !username;
  
  const [isFollowed, setIsFollowed] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false); 

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  // 🎯 YENİ: Post Düzenleme State'leri
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setUserNotFound(false); 
      
      try {
        const url = isOwnProfile ? 'http://127.0.0.1:8000/profilim' : `http://127.0.0.1:8000/kullanici/${username}`;
        const token = localStorage.getItem("tradein_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(url, { headers });
        setProfileData(response.data);
        
        setEditName(response.data.name || "");
        setEditBio(response.data.bio || "");

        if (!isOwnProfile) setIsFollowed(response.data.is_following || false);

        // 🎯 YENİ: Post verilerini FeedCard'ın istediği (user, time) formata çeviriyoruz
        if (response.data.posts) {
          const formattedPosts = response.data.posts.map(p => ({
            ...p,
            user: {
              name: response.data.name || response.data.username.toUpperCase(),
              avatar: response.data.avatar || `https://ui-avatars.com/api/?name=${response.data.username}&background=random&color=fff`
            },
            time: new Date(p.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' })
          }));
          setUserPosts(formattedPosts);
        }
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
  }, [username, isOwnProfile]);

  // 🚀 PROFİL BEĞENİ YÖNETİMİ
  const handleLike = async (postId) => {
    const token = localStorage.getItem("tradein_token");
    if (!token) { alert("Beğenmek için giriş yapmalısınız!"); return; }

    try {
      const response = await axios.post(`http://127.0.0.1:8000/post/${postId}/begen`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUserPosts(prevPosts => 
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

  // 🚀 GÖNDERİ DÜZENLEME (KAYDETME) İŞLEMİ
  const handleUpdatePost = async () => {
    if (!editPostContent.trim()) return;
    const token = localStorage.getItem("tradein_token");
    
    try {
      await axios.put(`http://127.0.0.1:8000/post/${editingPost.id}`, 
        { content: editPostContent }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Ekranda anlık güncelle
      setUserPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content: editPostContent } : p));
      setEditingPost(null); // Modalı kapat
    } catch (error) {
      console.error("Post güncellenemedi:", error);
      alert("Gönderi güncellenirken bir hata oluştu.");
    }
  };

  if (isLoading) return <div className="flex-1 min-h-screen bg-[#0f1117] text-white flex items-center justify-center pb-20"><p className="text-blue-500 animate-pulse font-semibold">Profil aranıyor...</p></div>;
  if (userNotFound || !profileData) return <div className="flex-1 min-h-screen bg-[#0f1117] text-white flex flex-col items-center justify-center pb-20"><div className="bg-[#1a1d26] border border-gray-800 p-10 rounded-3xl flex flex-col items-center max-w-md text-center"><UserX size={40} className="text-red-500 mb-6" /><h2 className="text-2xl font-black mb-2">Kullanıcı Bulunamadı</h2><Link to="/" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold mt-4">Ana Sayfaya Dön</Link></div></div>;

  return (
    <div className="flex-1 min-h-screen bg-[#0f1117] text-white pb-20 relative">
      <div className="max-w-4xl mx-auto pt-10 px-4">
        {/* HEADER AYNI */}
        <header className="flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-20 mb-12 border-b border-gray-800 pb-12">
          <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-full p-1 bg-gradient-to-tr from-blue-600 to-purple-600 mx-auto md:mx-0">
            <img src={profileData.avatar} alt="Avatar" className="w-full h-full rounded-full border-4 border-[#0f1117] object-cover" />
          </div>
          
          <div className="flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-6">
              <h2 className="text-xl font-light">{profileData.username}</h2>
              {isOwnProfile ? (
                isEditingProfile ? (
                  <div className="flex items-center gap-2">
                    <button onClick={handleSaveProfile} className="px-4 py-1.5 bg-green-600/20 text-green-500 border border-green-600/50 rounded-lg text-sm font-semibold hover:bg-green-600/30 transition-all flex items-center gap-1"><Check size={16} /> Kaydet</button>
                    <button onClick={() => { setIsEditingProfile(false); setEditName(profileData.name); setEditBio(profileData.bio); }} className="px-4 py-1.5 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-all flex items-center gap-1"><X size={16} /> İptal</button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditingProfile(true)} className="px-4 py-1.5 bg-[#1a1d26] border border-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all">Profili Düzenle</button>
                )
              ) : (
                <button onClick={handleFollow} className={`px-8 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${isFollowed ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-blue-600 text-white'}`}>
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
              <div className="w-full md:max-w-md mx-auto md:mx-0 mb-3"><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-[#1a1d26] border border-blue-500 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Adınız Soyadınız" /></div>
            ) : (<div className="font-bold mb-2">{profileData.name}</div>)}
            
            {isOwnProfile && isEditingProfile ? (
              <div className="w-full md:max-w-md mx-auto md:mx-0"><textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-[#1a1d26] border border-blue-500 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" rows="3" placeholder="Kendinden bahset..." /></div>
            ) : (<p className="text-sm text-gray-300 max-w-md mx-auto md:mx-0 leading-relaxed whitespace-pre-wrap">{profileData.bio}</p>)}
          </div>
        </header>

        {/* 🎯 GÖNDERİLER BÖLÜMÜ (Artık FeedCard çağırılıyor) */}
        <div className="w-full flex flex-col gap-4">
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <FeedCard 
                key={post.id} 
                post={post} 
                onLike={handleLike} 
                // Eğer kendi profilimizse, onEdit fonksiyonunu gönderiyoruz (Kalem ikonunu çıkartır)
                onEdit={isOwnProfile ? () => { setEditingPost(post); setEditPostContent(post.content); } : null}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700">
              <p className="text-gray-500 italic">Bu kullanıcı henüz bir paylaşım yapmadı.</p>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 POST DÜZENLEME MODALI (Sadece isOwnProfile durumunda açılabilir) */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 transition-all">
          <div className="bg-[#1a1d26] border border-gray-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-xl tracking-tight text-blue-500">Gönderiyi Düzenle</h3>
              <button onClick={() => setEditingPost(null)} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <textarea
                autoFocus
                value={editPostContent}
                onChange={(e) => setEditPostContent(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-gray-700 rounded-xl text-lg text-white placeholder-gray-600 resize-none outline-none focus:border-blue-500 p-4 min-h-[150px] transition-all"
              />
              
              <div className="flex justify-end pt-4 mt-4">
                <button 
                  disabled={!editPostContent.trim() || editPostContent === editingPost.content}
                  onClick={handleUpdatePost}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg"
                >
                  <Save size={18} /> Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;