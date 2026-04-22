import React, { useState } from 'react';
import { POSTS_DATA } from '../data/mockData';
import FeedCard from '../components/FeedCard';
import TrendSidebar from '../components/TrendSidebar';
import RecommendedTraders from '../components/RecommendedTraders';

const Home = () => {
  // Sekme (Tab) yönetimi için state
  const [activeTab, setActiveTab] = useState('Trendler');
  const tabs = ['Trendler', 'Borsa', 'Altın', 'Gümüş', 'Kripto'];

  return (
    <div className="flex gap-8 animate-fadeIn">
      
      {/* 1. ORTA PANEL: Ana Akış (Feed) */}
      <div className="flex-[1.8] min-w-0">
        
        {/* Üst Sekmeler (Tabs) */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-800 overflow-x-auto no-scrollbar sticky top-[116px] bg-[#0f1117] z-10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap ${
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

        {/* Gönderi Listesi (Mock Data'dan map ile çekiliyor) */}
        <div className="flex flex-col gap-4">
          {POSTS_DATA.length > 0 ? (
            POSTS_DATA.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-20 bg-[#161b22] rounded-2xl border border-dashed border-gray-700">
              <p className="text-gray-500 italic">Bu kategoride henüz gönderi bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. SAĞ PANEL: Trendler ve Öneriler */}
      {/* lg:block sayesinde mobil ekranlarda gizlenir, masaüstünde görünür */}
      <div className="hidden lg:block flex-1 max-w-[360px]">
        <div className="sticky top-[116px] flex flex-col gap-6">
          <TrendSidebar />
          <RecommendedTraders />
          
          {/* Footer Linkleri (Opsiyonel - Profesyonel görünüm için) */}
          <div className="px-4 flex flex-wrap gap-x-3 gap-y-1">
            {['Hakkımızda', 'Yardım', 'Kullanım Şartları', 'Gizlilik Politikası', 'Çerezler'].map(link => (
              <span key={link} className="text-[11px] text-gray-600 hover:underline cursor-pointer">
                {link}
              </span>
            ))}
            <p className="text-[11px] text-gray-600 mt-2 w-full">© 2026 TradeIn Corp.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
