import React, { useEffect, useMemo, useState } from "react";
import {
  Search, Star, Bell, ChevronDown,
  TrendingUp, TrendingDown, Newspaper, CalendarDays,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useTheme, getThemeClasses } from "../context/ThemeContext";
import {
  getMarkets, getMarketNews, getMarketCalendar,
  getMarketSentiment, addFavorite, removeFavorite,
} from "../services/marketService";

const categories = ["Tümü","Kripto","Döviz","Emtia","Borsa","Altın","Gümüş","ABD Piyasaları","Türkiye Piyasaları"];
const sortOptions = [
  { key: "gainers",   label: "En Çok Yükselenler", color: "text-green-400",   icon: TrendingUp },
  { key: "losers",    label: "En Çok Düşenler",    color: "text-red-400",     icon: TrendingDown },
  { key: "trending",  label: "Trend Olanlar",       color: "text-fuchsia-400", icon: TrendingUp },
  { key: "favorites", label: "Favorilerim",          color: "text-yellow-400",  icon: Star },
];

const mockMarkets = [
  { name:"Bitcoin",  symbol:"BTC",     category:"Kripto", price:"$66,732.41", tryPrice:"₺2,156,894.21", change:2.45,  marketCap:"$1.31T",   volume:"$28.45B", logo:"https://ui-avatars.com/api/?name=BT&background=f7931a&color=fff" },
  { name:"Ethereum", symbol:"ETH",     category:"Kripto", price:"$3,542.18",  tryPrice:"₺114,423.68",   change:1.32,  marketCap:"$425.67B", volume:"$15.67B", logo:"https://ui-avatars.com/api/?name=ET&background=627eea&color=fff" },
  { name:"Altın",    symbol:"XAU/USD", category:"Emtia",  price:"$2,338.45",  tryPrice:"₺75,547.12",    change:0.53,  marketCap:"-",        volume:"$18.92B", logo:"https://ui-avatars.com/api/?name=AL&background=facc15&color=000" },
  { name:"USD/TRY",  symbol:"USDTRY",  category:"Döviz",  price:"32.56",      tryPrice:"₺32.56",         change:-0.12, marketCap:"-",        volume:"₺32.12B", logo:"https://ui-avatars.com/api/?name=US&background=2563eb&color=fff" },
];
const mockNews     = [{ title:"Fed faiz kararını açıkladı", time:"10dk önce" },{ title:"Bitcoin ETF'lerine rekor giriş", time:"25dk önce" },{ title:"Altın fiyatları yükselişte", time:"1s önce" }];
const mockCalendar = [{ time:"15:30", currency:"USD", event:"Perakende Satışlar" },{ time:"17:00", currency:"USD", event:"FED Başkan Konuşması" },{ time:"11:00", currency:"TRY", event:"TCMB Faiz Kararı" }];

function Markets({ isLoggedIn, setIsLoggedIn }) {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";

  const [markets,         setMarkets]         = useState([]);
  const [news,            setNews]            = useState([]);
  const [calendar,        setCalendar]        = useState([]);
  const [sentiment,       setSentiment]       = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [selectedCategory,setSelectedCategory]= useState("Tümü");
  const [selectedSort,    setSelectedSort]    = useState("gainers");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [favorites,       setFavorites]       = useState([]);
  const [alarmSymbols,    setAlarmSymbols]    = useState([]);
  const [isSidebarOpen,   setIsSidebarOpen]   = useState(true);

  const handleLogout = () => { localStorage.removeItem("tradein_token"); setIsLoggedIn(false); };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [marketData, newsData, calendarData, sentimentData] = await Promise.all([
          getMarkets({ category: selectedCategory, sort: selectedSort, search: searchQuery, onlyFavorites: selectedSort === "favorites" }),
          getMarketNews(), getMarketCalendar(), getMarketSentiment(),
        ]);
        setMarkets(Array.isArray(marketData) && marketData.length > 0 ? marketData : mockMarkets);
        setNews(Array.isArray(newsData) && newsData.length > 0 ? newsData : mockNews);
        setCalendar(Array.isArray(calendarData) && calendarData.length > 0 ? calendarData : mockCalendar);
        setSentiment(sentimentData || { score: 57, label: "Nötr", yesterday: "54%", weekly: "+3%" });
      } catch {
        setMarkets(mockMarkets); setNews(mockNews); setCalendar(mockCalendar);
        setSentiment({ score: 57, label: "Nötr", yesterday: "54%", weekly: "+3%" });
      } finally { setLoading(false); }
    }
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedSort, searchQuery]);

  const filteredMarkets = useMemo(() => {
    let list = [...markets];
    if (selectedCategory !== "Tümü") list = list.filter(i => i.category === selectedCategory || i.name === selectedCategory);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); list = list.filter(i => i.name.toLowerCase().includes(q) || i.symbol.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)); }
    if (selectedSort === "gainers")   list.sort((a, b) => b.change - a.change);
    if (selectedSort === "losers")    list.sort((a, b) => a.change - b.change);
    if (selectedSort === "favorites") list = list.filter(i => favorites.includes(i.symbol));
    return list;
  }, [markets, selectedCategory, searchQuery, selectedSort, favorites]);

  const handleFavorite = async (symbol) => {
    try {
      if (favorites.includes(symbol)) { await removeFavorite(symbol); setFavorites(prev => prev.filter(i => i !== symbol)); }
      else { await addFavorite(symbol); setFavorites(prev => [...prev, symbol]); }
    } catch { setFavorites(prev => prev.includes(symbol) ? prev.filter(i => i !== symbol) : [...prev, symbol]); }
  };
  const handleAlarmClick = (symbol) => setAlarmSymbols(prev => prev.includes(symbol) ? prev : [...prev, symbol]);

  /* Tema bazlı lokal renkler (Tailwind'de dinamik interpolasyon çalışmaz, inline style ile override) */
  const searchBg    = isDark ? "#071224"  : "#f1f5f9";
  const searchBorder= isDark ? "#1a2a46"  : "#e2e8f0";
  const cardBg      = isDark ? "#161b22"  : "#ffffff";
  const cardBorder  = isDark ? "#1f2937"  : "#e2e8f0";
  const sortActiveBg= isDark ? "#0b1730"  : "#eff6ff";
  const sortBg      = isDark ? "#071224"  : "#f8fafc";
  const sortBorder  = isDark ? "#1a2a46"  : "#e2e8f0";
  const asideBg     = isDark ? "#161b22"  : "#ffffff";
  const asideBorder = isDark ? "#1f2937"  : "#e2e8f0";
  const sentInnerBg = isDark ? "#0c162b"  : "#f1f5f9";
  const newsDiv     = isDark ? "#1e293b"  : "#e2e8f0";

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col relative transition-colors duration-300`}>
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isLoggedIn={isLoggedIn}
        handleLogout={handleLogout} user={null} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="flex flex-1 w-full">
        <Sidebar isOpen={isSidebarOpen} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          <div className="flex flex-1 w-full gap-6">

            {/* ── Ana İçerik ── */}
            <section className="flex-1 min-w-0">
              <div className="mb-6">
                <h1 className={`text-4xl font-black ${t.textPrimary}`}>Piyasalar</h1>
                <p className={`${t.textSecond} mt-2`}>Anlık piyasa verilerini keşfet, analiz et ve fırsatları yakala.</p>
              </div>

              {/* Arama */}
              <div className="relative mb-6">
                <Search size={22} className={`absolute left-5 top-1/2 -translate-y-1/2 ${t.textMuted}`} />
                <input type="text" placeholder="Varlık, coin, sembol ara..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ backgroundColor: searchBg, borderColor: searchBorder, color: isDark ? "#f1f5f9" : "#1e293b" }}
                  className="w-full h-14 rounded-2xl border pl-14 pr-5 outline-none focus:border-blue-500 transition-all text-sm placeholder-slate-500"
                />
              </div>

              {/* Kategori filtreleri */}
              <div className="flex flex-wrap gap-3 mb-5">
                {categories.map(item => (
                  <button key={item} onClick={() => setSelectedCategory(item)}
                    className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      selectedCategory === item
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                        : `${t.cardBg2} ${t.textSecond} ${t.hoverBg} ${t.hoverText} border ${t.cardBorder}`
                    }`}>
                    {item}
                  </button>
                ))}
              </div>

              {/* Sıralama filtreleri */}
              <div className="flex flex-wrap gap-3 mb-8">
                {sortOptions.map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.key} onClick={() => setSelectedSort(item.key)}
                      style={{
                        backgroundColor: selectedSort === item.key ? sortActiveBg : sortBg,
                        borderColor: selectedSort === item.key ? "#3b82f6" : sortBorder,
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all">
                      <Icon size={18} className={item.color} />
                      <span className={`${item.color} text-sm font-semibold`}>{item.label}</span>
                      <ChevronDown size={16} className={t.textMuted} />
                    </button>
                  );
                })}
              </div>

              {/* Tablo başlığı */}
              <div className={`hidden lg:grid grid-cols-[2.4fr_1.2fr_1fr_1fr_1fr_0.8fr_1fr] gap-6 px-6 mb-4 text-sm ${t.textMuted}`}>
                <div>Varlık</div><div>Fiyat</div><div>24s Değişim</div>
                <div>Piyasa Değeri</div><div>Hacim (24s)</div><div>Grafik</div><div>İşlemler</div>
              </div>

              {/* Satırlar */}
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-28 rounded-3xl ${t.cardBg} border ${t.cardBorder} animate-pulse`} />
                  ))}
                </div>
              ) : filteredMarkets.length === 0 ? (
                <div style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                  className="rounded-3xl border border-dashed p-12 text-center">
                  <p className={`${t.textPrimary} font-semibold`}>Veri bulunamadı.</p>
                  <p className={`${t.textMuted} text-sm mt-2`}>Arama veya filtre seçimini değiştirip tekrar deneyebilirsin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMarkets.map(item => (
                    <div key={item.symbol}
                      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                      className="border rounded-3xl px-6 py-4 hover:border-blue-500/60 transition-all">
                      <div className="grid grid-cols-1 lg:grid-cols-[2.4fr_1.2fr_1fr_1fr_1fr_0.8fr_1fr] gap-6 items-center">
                        {/* Varlık */}
                        <div className="flex items-center gap-4 min-w-0">
                          <img src={item.logo} alt={item.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                          <div className="min-w-0">
                            <h3 className={`font-bold ${t.textPrimary} truncate`}>{item.name}</h3>
                            <div className={`flex flex-wrap items-center gap-2 text-sm ${t.textSecond}`}>
                              <span>{item.symbol}</span><span>{item.category}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded-lg">Trend</span>
                              <span className="text-yellow-400 text-xs bg-yellow-500/10 px-2 py-1 rounded-lg">Risk: Orta</span>
                            </div>
                          </div>
                        </div>

                        {/* Fiyat */}
                        <div>
                          <p className={`font-bold ${t.textPrimary} whitespace-nowrap`}>{item.price}</p>
                          <p className={`text-sm ${t.textSecond} whitespace-nowrap`}>{item.tryPrice}</p>
                        </div>

                        {/* Değişim */}
                        <div className={`font-bold whitespace-nowrap ${item.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {item.change >= 0 ? "+" : ""}{item.change}%
                        </div>

                        {/* Piyasa Değeri */}
                        <div className={`${t.textSecond} whitespace-nowrap`}>{item.marketCap}</div>

                        {/* Hacim */}
                        <div className={`${t.textSecond} whitespace-nowrap`}>{item.volume}</div>

                        {/* Grafik */}
                        <div className={`whitespace-nowrap ${item.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {item.change >= 0 ? "↗ ↗ ↗" : "↘ ↘ ↘"}
                        </div>

                        {/* İşlemler */}
                        <div className="flex items-center gap-4 justify-between">
                          <button onClick={() => handleFavorite(item.symbol)} className="hover:text-yellow-400 transition">
                            <Star size={20} fill={favorites.includes(item.symbol) ? "#facc15" : "transparent"} className={t.textSecond} />
                          </button>
                          <Link to={`/alarms?symbol=${encodeURIComponent(item.symbol)}`} onClick={() => handleAlarmClick(item.symbol)}
                            title={`${item.symbol} için alarm kur`}
                            className={`transition ${alarmSymbols.includes(item.symbol) ? "text-blue-400" : `${t.textSecond} hover:text-blue-400`}`}>
                            <Bell size={20} fill={alarmSymbols.includes(item.symbol) ? "#60a5fa" : "transparent"} />
                          </Link>
                          <Link to={`/markets/${item.symbol}`}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap">
                            Detay
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Sağ Panel ── */}
            <aside className="w-[300px] hidden lg:block shrink-0 space-y-4">

              {/* Son Haberler */}
              <div style={{ backgroundColor: asideBg, borderColor: asideBorder }} className="border rounded-3xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Newspaper className="text-red-400" size={22} />
                    <h3 className={`font-black text-xl ${t.textPrimary}`}>Son Haberler</h3>
                  </div>
                  <button className="text-blue-400 text-xs">Tümünü Gör</button>
                </div>
                <div className="space-y-3">
                  {news.map((item, index) => (
                    <div key={index} style={{ borderBottomColor: newsDiv }}
                      className="border-b last:border-0 pb-3 last:pb-0">
                      <p className={`text-sm font-semibold ${t.textPrimary}`}>{item.title}</p>
                      <p className={`text-xs ${t.textMuted} mt-1`}>{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ekonomik Takvim */}
              <div style={{ backgroundColor: asideBg, borderColor: asideBorder }} className="border rounded-3xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="text-blue-400" size={22} />
                    <h3 className={`font-black text-xl ${t.textPrimary}`}>Ekonomik Takvim</h3>
                  </div>
                  <button className="text-blue-400 text-xs">Tümünü Gör</button>
                </div>
                <div className="space-y-3">
                  {calendar.map((item, index) => (
                    <div key={index} className="grid grid-cols-[48px_42px_1fr] gap-2 text-sm">
                      <span className={t.textSecond}>{item.time}</span>
                      <span className={`font-bold ${t.textPrimary}`}>{item.currency}</span>
                      <span className={t.textSecond}>{item.event}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Piyasa Duyarlılığı */}
              <div style={{ backgroundColor: asideBg, borderColor: asideBorder }} className="border rounded-3xl p-5">
                <h3 className={`text-xl font-black ${t.textPrimary} mb-6`}>Piyasa Duyarlılığı</h3>
                <div className="flex justify-center mb-6">
                  <div className="w-36 h-36 rounded-full border-[9px] border-green-500 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-4xl font-black ${t.textPrimary}`}>{sentiment?.score || 57}%</div>
                      <div className={`${t.textSecond} text-sm mt-1`}>{sentiment?.label || "Nötr"}</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div style={{ backgroundColor: sentInnerBg }} className="rounded-2xl p-4 text-center">
                    <p className={`text-xs ${t.textMuted}`}>Dün</p>
                    <p className={`text-2xl font-black ${t.textPrimary} mt-1`}>{sentiment?.yesterday || "54%"}</p>
                  </div>
                  <div style={{ backgroundColor: sentInnerBg }} className="rounded-2xl p-4 text-center">
                    <p className={`text-xs ${t.textMuted}`}>Haftalık</p>
                    <p className="text-2xl font-black text-green-400 mt-1">{sentiment?.weekly || "+3%"}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Markets;
