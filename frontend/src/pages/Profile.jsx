import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Heart, UserPlus, UserCheck, Settings, Grid } from 'lucide-react';
import { POSTS_DATA } from '../data/mockData';

const Profile = () => {
  const { username } = useParams();
  const isOwnProfile = !username;
  
  // Takip durumunu yönetmek için state (Başlangıçta takip etmiyor: false)
  const [isFollowed, setIsFollowed] = useState(false);

  const profileData = {
    name: isOwnProfile ? "Pınar Karabulut" : username,
    username: isOwnProfile ? "@pinarkarabulut" : `@${username.toLowerCase()}`,
    avatar: "https://i.pravatar.cc/150?u=pinar",
    bio: "Software Developer | TradeIn Geliştiricisi 🚀",
    postsCount: 12, 
    followers: isFollowed ? "1.401" : "1.400", // Takip edilince sayı artsın
    following: "850"
  };

  return (
    <div className="flex-1 min-h-screen bg-[#0f1117] text-white pb-20">
      <div className="max-w-4xl mx-auto pt-10 px-4">
        <header className="flex flex-col md:flex-row items-center gap-10 md:gap-20 mb-12 border-b border-gray-800 pb-12">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-blue-600 to-purple-600">
            <img src={profileData.avatar} alt="P" className="w-full h-full rounded-full border-4 border-[#0f1117] object-cover" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
              <h2 className="text-xl font-light">{profileData.username}</h2>
              {isOwnProfile ? (
                <button className="px-4 py-1.5 bg-[#1a1d26] border border-gray-700 rounded-lg text-sm font-semibold">Profili Düzenle</button>
              ) : (
                <button 
                  onClick={() => setIsFollowed(!isFollowed)}
                  className={`px-8 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                    isFollowed 
                      ? 'bg-gray-800 text-gray-400 border border-gray-700' // Takip ediliyor: Gri pasif görünüm
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' // Takip et: Mavi aktif görünüm
                  }`}
                >
                  {isFollowed ? <><UserCheck size={18} /> Takip Ediliyor</> : <><UserPlus size={18} /> Takip Et</>}
                </button>
              )}
            </div>
            <div className="flex justify-center md:justify-start gap-10 mb-6 text-sm">
              <span><strong>{profileData.postsCount}</strong> gönderi</span>
              <span><strong>{profileData.followers}</strong> takipçi</span>
              <span><strong>{profileData.following}</strong> takip</span>
            </div>
            <div className="font-bold mb-1">{profileData.name}</div>
            <p className="text-sm text-gray-300">{profileData.bio}</p>
          </div>
        </header>

        {/* Gönderiler */}
        <div className="w-full flex flex-col gap-6">
          {POSTS_DATA.map((post) => (
            <div key={post.id} className="bg-[#1a1d26] border border-gray-800 rounded-2xl p-8 w-full shadow-xl">
              <p className="text-lg leading-relaxed mb-6">{post.content}</p>
              <div className="flex gap-8 text-gray-400 border-t border-gray-800 pt-6">
                <div className="flex items-center gap-2 hover:text-red-500 cursor-pointer"><Heart size={22} /> <span>{post.likes}</span></div>
                <div className="flex items-center gap-2 hover:text-blue-500 cursor-pointer"><MessageSquare size={22} /> <span>{post.comments}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;