import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Star,
  Bell,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Newspaper,
  CalendarDays,
} from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {
  getMarkets,
  getMarketNews,
  getMarketCalendar,
  getMarketSentiment,
  addFavorite,
  removeFavorite,
} from "../services/marketService";

const categories = [
  "Tümü",
  "Kripto",
  "Döviz",
  "Emtia",
  "Borsa",
  "Altın",
  "Gümüş",
  "ABD Piyasaları",
  "Türkiye Piyasaları",
];

const sortOptions = [
  { key: "gainers", label: "En Çok Yükselenler", color: "text-green-400", icon: TrendingUp },
  { key: "losers", label: "En Çok Düşenler", color: "text-red-400", icon: TrendingDown },
  { key: "trending", label: "Trend Olanlar", color: "text-fuchsia-400", icon: TrendingUp },
  { key: "favorites", label: "Favorilerim", color: "text-yellow-400", icon: Star },
];

const mockMarkets = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    category: "Kripto",
    price: "$66,732.41",
    tryPrice: "₺2,156,894.21",
    change: 2.45,
    marketCap: "$1.31T",
    volume: "$28.45B",
    logo: "https://ui-avatars.com/api/?name=BT&background=f7931a&color=fff",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    category: "Kripto",
    price: "$3,542.18",
    tryPrice: "₺114,423.68",
    change: 1.32,
    marketCap: "$425.67B",
    volume: "$15.67B",
    logo: "https://ui-avatars.com/api/?name=ET&background=627eea&color=fff",
  },
  {
    name: "Altın",
    symbol: "XAU/USD",
    category: "Emtia",
    price: "$2,338.45",
    tryPrice: "₺75,547.12",
    change: 0.53,
    marketCap: "-",
    volume: "$18.92B",
    logo: "https://ui-avatars.com/api/?name=AL&background=facc15&color=000",
  },
  {
    name: "USD/TRY",
    symbol: "USDTRY",
    category: "Döviz",
    price: "32.56",
    tryPrice: "₺32.56",
    change: -0.12,
    marketCap: "-",
    volume: "₺32.12B",
    logo: "https://ui-avatars.com/api/?name=US&background=2563eb&color=fff",
  },
];

const mockNews = [
  { title: "Fed faiz kararını açıkladı", time: "10dk önce" },
  { title: "Bitcoin ETF’lerine rekor giriş", time: "25dk önce" },
  { title: "Altın fiyatları yükselişte", time: "1s önce" },
];

const mockCalendar = [
  { time: "15:30", currency: "USD", event: "Perakende Satışlar" },
  { time: "17:00", currency: "USD", event: "FED Başkan Konuşması" },
  { time: "11:00", currency: "TRY", event: "TCMB Faiz Kararı" },
];

function Markets({ isLoggedIn, setIsLoggedIn }) {
  const [markets, setMarkets] = useState([]);
  const [news, setNews] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [sentiment, setSentiment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [selectedSort, setSelectedSort] = useState("gainers");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [alarmSymbols, setAlarmSymbols] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("tradein_token");
    setIsLoggedIn(false);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [marketData, newsData, calendarData, sentimentData] = await Promise.all([
          getMarkets({
            category: selectedCategory,
            sort: selectedSort,
            search: searchQuery,
            onlyFavorites: selectedSort === "favorites",
          }),
          getMarketNews(),
          getMarketCalendar(),
          getMarketSentiment(),
        ]);

        setMarkets(Array.isArray(marketData) && marketData.length > 0 ? marketData : mockMarkets);
        setNews(Array.isArray(newsData) && newsData.length > 0 ? newsData : mockNews);
        setCalendar(Array.isArray(calendarData) && calendarData.length > 0 ? calendarData : mockCalendar);
        setSentiment(sentimentData || { score: 57, label: "Nötr", yesterday: "54%", weekly: "+3%" });
      } catch {
        setMarkets(mockMarkets);
        setNews(mockNews);
        setCalendar(mockCalendar);
        setSentiment({ score: 57, label: "Nötr", yesterday: "54%", weekly: "+3%" });
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedSort, searchQuery]);

  const filteredMarkets = useMemo(() => {
    let list = [...markets];

    if (selectedCategory !== "Tümü") {
      list = list.filter(
        (item) =>
          item.category === selectedCategory ||
          item.name === selectedCategory
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.symbol.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    if (selectedSort === "gainers") {
      list.sort((a, b) => b.change - a.change);
    }

    if (selectedSort === "losers") {
      list.sort((a, b) => a.change - b.change);
    }

    if (selectedSort === "favorites") {
      list = list.filter((item) => favorites.includes(item.symbol));
    }

    return list;
  }, [markets, selectedCategory, searchQuery, selectedSort, favorites]);

  const handleFavorite = async (symbol) => {
    try {
      if (favorites.includes(symbol)) {
        await removeFavorite(symbol);
        setFavorites((prev) => prev.filter((item) => item !== symbol));
      } else {
        await addFavorite(symbol);
        setFavorites((prev) => [...prev, symbol]);
      }
    } catch {
      setFavorites((prev) =>
        prev.includes(symbol)
          ? prev.filter((item) => item !== symbol)
          : [...prev, symbol]
      );
    }
  };

  const handleAlarmClick = (symbol) => {
    setAlarmSymbols((prev) =>
      prev.includes(symbol) ? prev : [...prev, symbol]
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col relative">
      <Navbar
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        user={null}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex flex-1 w-full">
        <Sidebar
          isOpen={isSidebarOpen}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
        />

        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          <div className="flex flex-1 w-full gap-6">
            <section className="flex-1 min-w-0">
              <div className="mb-6">
                <h1 className="text-4xl font-black text-white">Piyasalar</h1>
                <p className="text-slate-400 mt-2">
                  Anlık piyasa verilerini keşfet, analiz et ve fırsatları yakala.
                </p>
              </div>

              <div className="relative mb-6">
                <Search
                  size={22}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Varlık, coin, sembol ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 rounded-2xl bg-[#071224] border border-[#1a2a46] pl-14 pr-5 outline-none focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-3 mb-5">
                {categories.map((item) => (
                  <button
                    key={item}
                    onClick={() => setSelectedCategory(item)}
                    className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      selectedCategory === item
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                        : "bg-[#161b22] text-slate-300 hover:bg-[#1f2937] hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                {sortOptions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.key}
                      onClick={() => setSelectedSort(item.key)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all ${
                        selectedSort === item.key
                          ? "border-blue-500 bg-[#0b1730]"
                          : "border-[#1a2a46] bg-[#071224]"
                      }`}
                    >
                      <Icon size={18} className={item.color} />
                      <span className={`${item.color} text-sm font-semibold`}>
                        {item.label}
                      </span>
                      <ChevronDown size={16} />
                    </button>
                  );
                })}
              </div>

              <div className="hidden lg:grid grid-cols-[2.4fr_1.2fr_1fr_1fr_1fr_0.8fr_1fr] gap-6 px-6 mb-4 text-sm text-slate-400">
                <div>Varlık</div>
                <div>Fiyat</div>
                <div>24s Değişim</div>
                <div>Piyasa Değeri</div>
                <div>Hacim (24s)</div>
                <div>Grafik</div>
                <div>İşlemler</div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-28 rounded-3xl bg-[#161b22] border border-[#1a2a46] animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredMarkets.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-700 bg-[#161b22] p-12 text-center">
                  <p className="text-slate-300 font-semibold">Veri bulunamadı.</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Arama veya filtre seçimini değiştirip tekrar deneyebilirsin.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMarkets.map((item) => (
                    <div
                      key={item.symbol}
                      className="bg-[#161b22] border border-[#1f2937] rounded-3xl px-6 py-4 hover:border-blue-500/60 transition-all"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-[2.4fr_1.2fr_1fr_1fr_1fr_0.8fr_1fr] gap-6 items-center">
                        <div className="flex items-center gap-4 min-w-0">
                          <img
                            src={item.logo}
                            alt={item.name}
                            className="w-12 h-12 rounded-full object-cover shrink-0"
                          />

                          <div className="min-w-0">
                            <h3 className="font-bold text-white truncate">
                              {item.name}
                            </h3>

                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                              <span>{item.symbol}</span>
                              <span>{item.category}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded-lg">
                                Trend
                              </span>

                              <span className="text-yellow-400 text-xs bg-yellow-500/10 px-2 py-1 rounded-lg">
                                Risk: Orta
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-white whitespace-nowrap">
                            {item.price}
                          </p>
                          <p className="text-sm text-slate-400 whitespace-nowrap">
                            {item.tryPrice}
                          </p>
                        </div>

                        <div
                          className={`font-bold whitespace-nowrap ${
                            item.change >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {item.change >= 0 ? "+" : ""}
                          {item.change}%
                        </div>

                        <div className="text-slate-200 whitespace-nowrap">
                          {item.marketCap}
                        </div>

                        <div className="text-slate-200 whitespace-nowrap">
                          {item.volume}
                        </div>

                        <div
                          className={`whitespace-nowrap ${
                            item.change >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {item.change >= 0 ? "↗ ↗ ↗" : "↘ ↘ ↘"}
                        </div>

                        <div className="flex items-center gap-4 justify-between">
                          <button
                            onClick={() => handleFavorite(item.symbol)}
                            className="hover:text-yellow-400 transition"
                          >
                            <Star
                              size={20}
                              fill={
                                favorites.includes(item.symbol)
                                  ? "#facc15"
                                  : "transparent"
                              }
                            />
                          </button>

                          <Link
                            to={`/alarms?symbol=${encodeURIComponent(item.symbol)}`}
                            onClick={() => handleAlarmClick(item.symbol)}
                            title={`${item.symbol} için alarm kur`}
                            className={`transition ${
                              alarmSymbols.includes(item.symbol)
                                ? "text-blue-400"
                                : "text-slate-300 hover:text-blue-400"
                            }`}
                          >
                            <Bell
                              size={20}
                              fill={
                                alarmSymbols.includes(item.symbol)
                                  ? "#60a5fa"
                                  : "transparent"
                              }
                            />
                          </Link>

                          <Link
                            to={`/markets/${item.symbol}`}
                            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap"
                          >
                            Detay
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <aside className="w-[300px] hidden lg:block shrink-0 space-y-4">
              <div className="bg-[#161b22] border border-[#1f2937] rounded-3xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Newspaper className="text-red-400" size={22} />
                    <h3 className="font-black text-xl text-white">Son Haberler</h3>
                  </div>

                  <button className="text-blue-400 text-xs">Tümünü Gör</button>
                </div>

                <div className="space-y-3">
                  {news.map((item, index) => (
                    <div
                      key={index}
                      className="border-b border-slate-800 last:border-0 pb-3 last:pb-0"
                    >
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#161b22] border border-[#1f2937] rounded-3xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="text-blue-400" size={22} />
                    <h3 className="font-black text-xl text-white">Ekonomik Takvim</h3>
                  </div>

                  <button className="text-blue-400 text-xs">Tümünü Gör</button>
                </div>

                <div className="space-y-3">
                  {calendar.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[48px_42px_1fr] gap-2 text-sm"
                    >
                      <span className="text-slate-400">{item.time}</span>
                      <span className="font-bold text-white">{item.currency}</span>
                      <span className="text-slate-300">{item.event}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#161b22] border border-[#1f2937] rounded-3xl p-5">
                <h3 className="text-xl font-black text-white mb-6">
                  Piyasa Duyarlılığı
                </h3>

                <div className="flex justify-center mb-6">
                  <div className="w-36 h-36 rounded-full border-[9px] border-green-500 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-black text-white">
                        {sentiment?.score || 57}%
                      </div>
                      <div className="text-slate-400 text-sm mt-1">
                        {sentiment?.label || "Nötr"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0c162b] rounded-2xl p-4 text-center">
                    <p className="text-xs text-slate-400">Dün</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {sentiment?.yesterday || "54%"}
                    </p>
                  </div>

                  <div className="bg-[#0c162b] rounded-2xl p-4 text-center">
                    <p className="text-xs text-slate-400">Haftalık</p>
                    <p className="text-2xl font-black text-green-400 mt-1">
                      {sentiment?.weekly || "+3%"}
                    </p>
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