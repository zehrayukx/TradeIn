import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageSquare, Heart, UserPlus, UserCheck, UserX } from 'lucide-react';
import axios from 'axios';

const Profile = () => {
  const { username } = useParams();
  const isOwnProfile = !username;
  
  const [isFollowed, setIsFollowed] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false); 

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setUserNotFound(false); 
      
      try {
        const url = isOwnProfile 
          ? 'http://127.0.0.1:8000/profilim' 
          : `http://127.0.0.1:8000/kullanici/${username}`;
          
        const token = localStorage.getItem("tradein_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(url, { headers });
        setProfileData(response.data);

        // YENİ: Backend'den gelen gerçek takip durumunu state'e yazıyoruz
        if (!isOwnProfile) {
          setIsFollowed(response.data.is_following || false);
        }

        if (response.data.posts) {
          setUserPosts(response.data.posts);
        }
      } catch (error) {
          console.error("Profil yükleme hatası:", error);
          
          if (error.response?.status === 401) {
              localStorage.removeItem("tradein_token");
              window.location.href = "/login"; 
              return;
          }
          
          if (!isOwnProfile) {
              setUserNotFound(true);
          }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [username, isOwnProfile]);

  // 🚀 GERÇEK VERİTABANI TAKİP İŞLEMİ
  const handleFollow = async () => {
    const token = localStorage.getItem("tradein_token");
    if (!token) {
      alert("Takip etmek için giriş yapmalısınız!"); // İleride buraya da modal bağlayabilirsin
      return;
    }

    try {
      // Backend'den aldığımız hedef kullanıcının ID'sine istek atıyoruz
      const response = await axios.post(`http://127.0.0.1:8000/takip-et/${profileData.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Backend'in toggle (aç/kapa) mantığına göre arayüzü anında güncelliyoruz
      const isNowFollowing = response.data.mesaj.includes("takip edildi");
      setIsFollowed(isNowFollowing);
      
      // Takipçi sayısını ekranda anlık olarak +1 / -1 yapıyoruz
      setProfileData(prev => ({
        ...prev,
        followers: isNowFollowing ? prev.followers + 1 : prev.followers - 1
      }));

    } catch (error) {
      console.error("Takip işlemi sırasında hata oluştu:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-[#0f1117] text-white flex items-center justify-center pb-20">
        <p className="text-blue-500 animate-pulse font-semibold">Profil aranıyor...</p>
      </div>
    );
  }

  if (userNotFound || !profileData) {
    return (
      <div className="flex-1 min-h-screen bg-[#0f1117] text-white flex flex-col items-center justify-center pb-20">
        <div className="bg-[#1a1d26] border border-gray-800 p-10 rounded-3xl flex flex-col items-center max-w-md text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <UserX size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black mb-2">Kullanıcı Bulunamadı</h2>
          <p className="text-gray-400 mb-8">
            Veritabanımızda <span className="text-white font-bold">@{username}</span> adında bir kullanıcı yer almıyor.
          </p>
          <Link to="/" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-[#0f1117] text-white pb-20">
      <div className="max-w-4xl mx-auto pt-10 px-4">
        <header className="flex flex-col md:flex-row items-center gap-10 md:gap-20 mb-12 border-b border-gray-800 pb-12">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-blue-600 to-purple-600">
            <img src={profileData.avatar} alt="Avatar" className="w-full h-full rounded-full border-4 border-[#0f1117] object-cover" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
              <h2 className="text-xl font-light">{profileData.username}</h2>
              {isOwnProfile ? (
                <button className="px-4 py-1.5 bg-[#1a1d26] border border-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all">
                  Profili Düzenle
                </button>
              ) : (
                <button 
                  onClick={handleFollow} // 🚀 DİKKAT: Artık gerçek fonksiyon çalışıyor
                  className={`px-8 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                    isFollowed 
                      ? 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700' 
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 hover:bg-blue-500' 
                  }`}
                >
                  {isFollowed ? <><UserCheck size={18} /> Takip Ediliyor</> : <><UserPlus size={18} /> Takip Et</>}
                </button>
              )}
            </div>
            <div className="flex justify-center md:justify-start gap-10 mb-6 text-sm">
              <span><strong>{profileData.postsCount}</strong> gönderi</span>
              {/* Sahte hesabı kaldırdık, doğrudan profilDatasından okuyoruz */}
              <span><strong>{profileData.followers.toLocaleString('tr-TR')}</strong> takipçi</span>
              <span><strong>{profileData.following.toLocaleString('tr-TR')}</strong> takip</span>
            </div>
            <div className="font-bold mb-1">{profileData.name}</div>
            <p className="text-sm text-gray-300">{profileData.bio}</p>
          </div>
        </header>

        {/* Gönderiler Bölümü */}
        <div className="w-full flex flex-col gap-6">
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <div key={post.id} className="bg-[#1a1d26] border border-gray-800 rounded-2xl p-8 w-full shadow-xl">
                <p className="text-[10px] text-gray-500 mb-2">
                  {post.tarih ? new Date(post.tarih).toLocaleDateString('tr-TR') : ''}
                </p>
                <p className="text-lg leading-relaxed mb-6">{post.content}</p>
                
                <div className="flex gap-8 text-gray-400 border-t border-gray-800 pt-6">
                  {/* Profil sayfasındaki kalpler de backend verisine uygun renklensin diye: */}
                  <div className={`flex items-center gap-2 transition-colors ${post.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                    <Heart size={22} className={post.isLiked ? "fill-red-500" : ""} /> 
                    <span>{post.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 hover:text-blue-500 cursor-pointer transition-colors">
                    <MessageSquare size={22} /> <span>{post.comments || 0}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700">
              <p className="text-gray-500 italic">Bu kullanıcı henüz bir paylaşım yapmadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;