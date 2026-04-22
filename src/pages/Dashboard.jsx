import React, { useState } from 'react';
import { 
  Home, Search, Bell, Mail, Bookmark, User, MoreHorizontal,
  MessageSquare, Repeat2, Share2, TrendingUp, ChevronDown
} from 'lucide-react';

const Dashboard = () => {
  const [posts] = useState([
    {
      id: 1,
      author: "Zehra Kaya",
      handle: "@zehra_trade",
      time: "3 dk önce",
      content: "Bitcoin 68.000$ direnç seviyesini güçlü hacimle yukarı kırdı. Bu, 75.000$'a doğru yeni bir yükseliş dalgasının başlangıcı olabilir...",
      stats: { price: "$67.842", change: "+1.87%" },
      likes: 2847, comments: 312, retweets: 891
    }
  ]);

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-gray-300 max-w-[1300px] mx-auto">
      
      {/* SOL SIDEBAR (YENİ SADE VE ŞIK TASARIM) */}
      <aside className="w-72 border-r border-gray-800 p-4 flex flex-col justify-between sticky h-screen top-0">
        <div>
          <div className="flex items-center gap-2 px-4 mb-6">
            <div className="bg-blue-600 p-2 rounded-xl">
              <TrendingUp className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">TradeIn</span>
          </div>

          <nav className="space-y-1">
            <NavItem icon={<Home size={28}/>} label="Anasayfa" active />
            <NavItem icon={<Search size={28}/>} label="Keşfet" />
            <NavItem icon={<Bell size={28}/>} label="Bildirimler" badge="12" />
            <NavItem icon={<Mail size={28}/>} label="Mesajlar" />
            <NavItem icon={<Bookmark size={28}/>} label="Yer İşaretleri" />
            <NavItem icon={<User size={28}/>} label="Profil" />
            <NavItem icon={<MoreHorizontal size={28}/>} label="Daha Fazla" />
          </nav>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full mt-6 transition text-lg shadow-lg shadow-blue-900/20">
            Paylaş
          </button>
        </div>

        {/* SOL ALT PROFİL KARTI */}
        <div className="flex items-center justify-between p-3 hover:bg-white/10 rounded-full cursor-pointer transition mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-500 rounded-full flex items-center justify-center font-bold text-white uppercase">Z</div>
            <div className="text-left">
              <p className="text-sm font-bold text-white leading-tight">Zehra Kaya</p>
              <p className="text-sm text-gray-500">@zehra_trade</p>
            </div>
          </div>
          <MoreHorizontal size={18} className="text-gray-500" />
        </div>
      </aside>

      {/* ORTA AKIŞ (SOLA YASLI) */}
      <main className="flex-1 max-w-2xl border-r border-gray-800">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 bg-[#0d1117]/80 backdrop-blur-md z-10">
          <h2 className="text-xl font-bold text-white">Anasayfa</h2>
          <div className="flex items-center gap-3 bg-[#161b22] p-1 pr-3 rounded-full border border-gray-800 cursor-pointer hover:bg-gray-800 transition">
             <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">Z</div>
             <span className="text-xs font-medium text-white">Zehra</span>
             <ChevronDown size={12} />
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* KATEGORİLER (DOLAR, EURO, STERLİN EKLENDİ) */}
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-gray-800">
            <button className="bg-blue-600 text-white px-5 py-1.5 rounded-full text-sm font-bold">Trendler</button>
            {['Takip Edilenler', 'Borsa', 'Altın', 'Bitcoin', 'Dolar', 'Euro', 'Sterlin'].map(cat => (
              <button key={cat} className="bg-[#161b22] hover:bg-gray-800 text-gray-400 px-5 py-1.5 rounded-full text-sm font-bold transition whitespace-nowrap">
                {cat}
              </button>
            ))}
          </div>

          {/* PAYLAŞIM ALANI */}
          <div className="flex gap-4 p-4 border-b border-gray-800">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-lg">Z</div>
            <div className="flex-1 space-y-4">
              <textarea 
                placeholder="Neler oluyor?" 
                className="w-full bg-transparent text-xl focus:outline-none resize-none text-white placeholder-gray-600"
                rows="2"
              ></textarea>
              <div className="flex justify-between items-center border-t border-gray-800 pt-3">
                <div className="flex text-blue-500 gap-4">
                   <TrendingUp size={20} className="cursor-pointer" />
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold transition text-sm shadow-md">Paylaş</button>
              </div>
            </div>
          </div>

          {/* AKIŞ KARTI */}
          {posts.map(post => (
            <div key={post.id} className="p-4 border-b border-gray-800 hover:bg-white/[0.01] transition cursor-pointer">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white uppercase">Z</div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white">{post.author}</span>
                      <span className="text-gray-500 text-sm">{post.handle} · {post.time}</span>
                    </div>
                    <MoreHorizontal size={18} className="text-gray-500" />
                  </div>
                  <p className="text-gray-200 mt-2 text-[15px] leading-normal">{post.content}</p>
                  
                  {/* VERİ KUTULARI (GÖRSELDEKİ GİBİ ŞIK) */}
                  <div className="mt-4 p-4 bg-[#161b22] border border-gray-800 rounded-2xl flex justify-around shadow-inner">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">BTC Fiyat</p>
                      <p className="text-white font-bold text-lg">{post.stats.price}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Değişim</p>
                      <p className="text-green-500 font-bold text-lg">{post.stats.change}</p>
                    </div>
                  </div>

                  <div className="flex justify-between mt-4 text-gray-500 max-w-md">
                    <ActionButton icon={<MessageSquare size={18}/>} count={post.comments} />
                    <ActionButton icon={<Repeat2 size={18}/>} count={post.retweets} />
                    <ActionButton icon={<Share2 size={18}/>} />
                    <ActionButton icon={<Bookmark size={18}/>} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* SAĞ TARAF (TRENDLER VE ÖNERİLER) */}
      <aside className="w-80 p-6 space-y-4 sticky h-screen top-0 hidden lg:block">
        <div className="bg-[#161b22] rounded-2xl p-4 border border-gray-800">
          <h3 className="text-xl font-black text-white mb-4 px-2">Trendler</h3>
          {[
            { tag: "#Bitcoin", posts: "125K" },
            { tag: "#BorsaIstanbul", posts: "42K" },
            { tag: "#Altın", posts: "89K" },
            { tag: "#Ethereum", posts: "31K" }
          ].map((trend, i) => (
            <div key={i} className="hover:bg-white/5 p-3 rounded-xl cursor-pointer transition">
              <p className="text-xs text-gray-500">Türkiye konumunda trend</p>
              <p className="text-[15px] font-bold text-white">{trend.tag}</p>
              <p className="text-xs text-gray-500">{trend.posts} Paylaşım</p>
            </div>
          ))}
        </div>

        <div className="bg-[#161b22] rounded-2xl p-4 border border-gray-800">
          <h3 className="text-xl font-black text-white mb-4 px-2">Önerilenler</h3>
          {[
            { name: "Warren Buffett", handle: "@warrenb" },
            { name: "Michael Saylor", handle: "@saylor" }
          ].map((user, i) => (
            <div key={i} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div>
                  <p className="text-sm font-bold text-white">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.handle}</p>
                </div>
              </div>
              <button className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition">Takip Et</button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

// YARDIMCI BİLEŞENLER
const NavItem = ({ icon, label, active, badge }) => (
  <div className={`flex items-center justify-between px-4 py-3 rounded-full cursor-pointer transition w-fit pr-8 ${active ? 'text-white font-bold bg-white/5' : 'hover:bg-white/10 text-gray-200'}`}>
    <div className="flex items-center gap-5">
      {icon}
      <span className="text-xl font-medium">{label}</span>
    </div>
    {badge && <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">{badge}</span>}
  </div>
);

const ActionButton = ({ icon, count }) => (
  <div className="flex items-center gap-2 hover:text-blue-500 transition cursor-pointer p-2 hover:bg-blue-500/10 rounded-full">
    {icon}
    {count && <span className="text-xs">{count}</span>}
  </div>
);

export default Dashboard;