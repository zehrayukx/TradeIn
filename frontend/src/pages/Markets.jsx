import React, { useEffect, useMemo, useState } from "react";
import {
  Search, Bell, ChevronDown,
  TrendingUp, TrendingDown, Target, Activity, Smartphone, Mail, X
} from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AssetDetailModal from '../components/AssetDetailModal';
import { useTheme, getThemeClasses } from "../context/ThemeContext";
import { getMarkets } from "../services/marketService";
import ChatBox from '../components/ChatBox';

const categories = ["Tümü","Kripto","Döviz","Emtia","Borsa","Altın","Gümüş"];

const FALLBACK_DATA = [
  { name:"Bitcoin",  symbol:"BTC", category:"Kripto", price:"$68,500.00", tryPrice:"₺2,212,550.00", change:1.20, marketCap:"$1.31T", volume:"$28.45B", logo:"https://ui-avatars.com/api/?name=BT&background=f7931a&color=fff" },
  { name:"Ethereum", symbol:"ETH", category:"Kripto", price:"$3,542.18", tryPrice:"₺114,423.68", change:-0.45, marketCap:"$425.67B", volume:"$15.67B", logo:"https://ui-avatars.com/api/?name=ET&background=627eea&color=fff" },
  { name:"Altın",    symbol:"XAU/TRY (Gr)", category:"Emtia", price:"2,450.00", tryPrice:"₺2,450.00", change:0.53, marketCap:"-", volume:"$18.92B", logo:"https://ui-avatars.com/api/?name=AL&background=facc15&color=000" },
  { name:"USD/TRY",  symbol:"USDTRY", category:"Döviz", price:"32.56", tryPrice:"₺32.56", change:0.18, marketCap:"-", volume:"₺32.12B", logo:"https://ui-avatars.com/api/?name=US&background=2563eb&color=fff" },
  { name:"Euro",     symbol:"EURTRY", category:"Döviz", price:"35.22", tryPrice:"₺35.22", change:0.22, marketCap:"-", volume:"₺28.45B", logo:"https://ui-avatars.com/api/?name=EU&background=003399&color=fff" },
  { name:"Sterlin",  symbol:"GBPTRY", category:"Döviz", price:"41.15", tryPrice:"₺41.15", change:-0.05, marketCap:"-", volume:"₺12.12B", logo:"https://ui-avatars.com/api/?name=GB&background=cf142b&color=fff" },
  { name:"BNB",      symbol:"BNB", category:"Kripto", price:"$610.20", tryPrice:"₺19,700.00", change:0.95, marketCap:"$91B", volume:"$2.1B", logo:"https://ui-avatars.com/api/?name=BN&background=f0b90b&color=fff" },
  { name:"Solana",   symbol:"SOL", category:"Kripto", price:"$162.45", tryPrice:"₺5,250.00", change:-1.10, marketCap:"$75B", volume:"$3.9B", logo:"https://ui-avatars.com/api/?name=SO&background=000000&color=fff" },
  { name:"XRP",      symbol:"XRP", category:"Kripto", price:"$0.51", tryPrice:"₺16.50", change:0.05, marketCap:"$28B", volume:"$1.1B", logo:"https://ui-avatars.com/api/?name=XR&background=23292f&color=fff" },
  { name:"Dogecoin", symbol:"DOGE", category:"Kripto", price:"$0.15", tryPrice:"₺4.85", change:-2.30, marketCap:"$22B", volume:"$1.8B", logo:"https://ui-avatars.com/api/?name=DO&background=c2a633&color=fff" },
];

function Markets({ isLoggedIn, setIsLoggedIn }) {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";

  const [markets,         setMarkets]         = useState(FALLBACK_DATA);
  const [loading,         setLoading]         = useState(true);
  const [searchQuery,     setSearchQuery]     = useState("");
  const [alarmSymbols,    setAlarmSymbols]    = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("Tümü");

  const [selectedAssetForChart, setSelectedAssetForChart] = useState(null);

  const [showAlarmModal,    setShowAlarmModal]    = useState(false);
  const [modalAsset,        setModalAsset]        = useState(ASSET_TYPES[0]);
  const [modalTargetPrice,  setModalTargetPrice]  = useState('');
  const [modalCondition,    setModalCondition]    = useState('above');
  const [modalNotifyEmail,  setModalNotifyEmail]  = useState(true);
  const [modalNotifyBrowser,setModalNotifyBrowser]= useState(true);
  const [modalDropdownOpen, setModalDropdownOpen] = useState(false);
  const [isSidebarOpen,     setIsSidebarOpen]     = useState(true);
  const [toast,             setToast]             = useState(null);

  const isMasterPriceNotifOn = localStorage.getItem('notif_price') !== 'false';

  const handleLogout = () => { localStorage.removeItem("tradein_token"); setIsLoggedIn(false); };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let combinedMarkets = [...FALLBACK_DATA];

        const [fxResponse, cryptoResponse, goldResponse] = await Promise.allSettled([
          fetch("https://open.er-api.com/v6/latest/USD"),
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple,dogecoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true"),
          fetch("https://www.goldapi.io/api/XAU/TRY", {
            headers: {
              "x-access-token": "goldapi-20e7b14c71868c1919866bf5c7d57e7c-io", 
              "Content-Type": "application/json"
            }
          }).catch(() => null)
        ]);

        if (fxResponse.status === "fulfilled") {
          try {
            const fxData = await fxResponse.value.json();
            if (fxData && fxData.rates) {
              const tryRate = fxData.rates.TRY;
              const eurRate = fxData.rates.EUR;
              const gbpRate = fxData.rates.GBP;

              // DOLAR GÜNCELLEMESİ
              const usdIndex = combinedMarkets.findIndex(m => m.symbol === "USDTRY");
              if (usdIndex !== -1) {
                combinedMarkets[usdIndex].price = tryRate.toFixed(4);
                combinedMarkets[usdIndex].tryPrice = `₺${tryRate.toFixed(4)}`;
                combinedMarkets[usdIndex].rawPrice = tryRate;
              }

              // EURO GÜNCELLEMESİ
              const eurIndex = combinedMarkets.findIndex(m => m.symbol === "EURTRY");
              if (eurIndex !== -1 && eurRate) {
                const liveEur = tryRate / eurRate;
                combinedMarkets[eurIndex].price = liveEur.toFixed(4);
                combinedMarkets[eurIndex].tryPrice = `₺${liveEur.toFixed(4)}`;
                combinedMarkets[eurIndex].rawPrice = liveEur;
              }

              // STERLİN GÜNCELLEMESİ
              const gbpIndex = combinedMarkets.findIndex(m => m.symbol === "GBPTRY");
              if (gbpIndex !== -1 && gbpRate) {
                const liveGbp = tryRate / gbpRate;
                combinedMarkets[gbpIndex].price = liveGbp.toFixed(4);
                combinedMarkets[gbpIndex].tryPrice = `₺${liveGbp.toFixed(4)}`;
                combinedMarkets[gbpIndex].rawPrice = liveGbp;
              }
            }
          } catch (e) { console.error("Döviz JSON hatası:", e); }
        }

        if (cryptoResponse.status === "fulfilled") {
          try {
            const cryptoData = await cryptoResponse.value.json();
            if (cryptoData) {
              const cryptos = [
                { id: 'bitcoin', symbol: 'BTC' }, { id: 'ethereum', symbol: 'ETH' }, { id: 'binancecoin', symbol: 'BNB' }, 
                { id: 'solana', symbol: 'SOL' }, { id: 'ripple', symbol: 'XRP' }, { id: 'dogecoin', symbol: 'DOGE' }
              ];
              cryptos.forEach(c => {
                if (cryptoData[c.id]) {
                  const data = cryptoData[c.id];
                  const idx = combinedMarkets.findIndex(m => m.symbol === c.symbol);
                  if (idx !== -1) {
                    combinedMarkets[idx].price = c.symbol === 'DOGE' || c.symbol === 'XRP' ? `$${data.usd.toFixed(4)}` : `$${data.usd.toLocaleString('en-US')}`;
                    combinedMarkets[idx].change = data.usd_24h_change.toFixed(2);
                    combinedMarkets[idx].marketCap = `$${(data.usd_market_cap / 1e9).toFixed(2)}B`;
                    combinedMarkets[idx].rawPrice = data.usd;
                  }
                }
              });
            }
          } catch (e) { console.error("Kripto JSON hatası:", e); }
        }

        if (goldResponse.status === "fulfilled" && goldResponse.value) {
          try {
            const goldData = await goldResponse.value.json();
            if (goldData && goldData.price) {
              const gramAltinTL = goldData.price / 31.1034768;
              const idx = combinedMarkets.findIndex(m => m.symbol === "XAU/TRY (Gr)");
              if (idx !== -1) {
                combinedMarkets[idx].price = gramAltinTL.toFixed(2);
                combinedMarkets[idx].tryPrice = `₺${gramAltinTL.toFixed(2)}`;
                combinedMarkets[idx].rawPrice = gramAltinTL;
              }
            }
          } catch (e) { console.error("Altın JSON hatası:", e); }
        }

        setMarkets(combinedMarkets);
      } catch (error) {
        console.error("Genel veri çekme hatası:", error);
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 60000); 
    return () => clearInterval(interval);
  }, []); 

  const assetPrices = useMemo(() => ({
    Bitcoin: markets.find(m => m.symbol === 'BTC')?.rawPrice,
    Dolar:   markets.find(m => m.symbol === 'USDTRY')?.rawPrice,
    Euro:    markets.find(m => m.symbol === 'EURTRY')?.rawPrice,
    Sterlin: markets.find(m => m.symbol === 'GBPTRY')?.rawPrice,
    Altın:   markets.find(m => m.symbol === 'XAU/TRY (Gr)')?.rawPrice,
  }), [markets]);

  const formatPrice = (val) => {
    if (!val || isNaN(val)) return "";
    return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(val);
  };

  const filteredMarkets = useMemo(() => {
    let list = [...markets];
    if (selectedCategory !== "Tümü") list = list.filter(i => i.category === selectedCategory || i.name === selectedCategory);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); list = list.filter(i => i.name.toLowerCase().includes(q) || i.symbol.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)); }
    
    return list;
  }, [markets, selectedCategory, searchQuery]);

  const handleAlarmClick = (symbol) => {
    const nameMap = {
      BTC: 'Bitcoin', ETH: 'Bitcoin', BNB: 'Bitcoin', SOL: 'Bitcoin', XRP: 'Bitcoin', DOGE: 'Bitcoin',
      USDTRY: 'Dolar', EURTRY: 'Euro', GBPTRY: 'Sterlin',
      'XAU/TRY (Gr)': 'Altın', BIST: 'Borsa',
    };
    const assetName = nameMap[symbol] || 'Bitcoin';
    const asset = ASSET_TYPES.find(a => a.name === assetName) || ASSET_TYPES[0];
    
    setModalAsset(asset);
    setModalTargetPrice('');
    setModalCondition('above');
    setModalDropdownOpen(false);
    
    setModalNotifyEmail(isMasterPriceNotifOn);
    setModalNotifyBrowser(isMasterPriceNotifOn);
    
    setAlarmSymbols(prev => prev.includes(symbol) ? prev : [...prev, symbol]);
    setShowAlarmModal(true);
  };

  const handleModalCreate = async () => {
    if (!modalTargetPrice || isNaN(Number(modalTargetPrice)) || Number(modalTargetPrice) <= 0) return;

    const newAlarmData = {
      asset: modalAsset.name,
      target_price: Number(modalTargetPrice),
      condition: modalCondition,
      notify_email: modalNotifyEmail,
      notify_browser: modalNotifyBrowser,
    };

    try {
      const token = localStorage.getItem('tradein_token');

      if (token) {
        await fetch('http://127.0.0.1:8000/alarm-kur', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newAlarmData)
        });
      }

      const localAlarm = {
        ...newAlarmData,
        id: Date.now(),
        is_active: true,
        created_at: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('tradein_alarms') || '[]');
      localStorage.setItem('tradein_alarms', JSON.stringify([localAlarm, ...existing]));

      setToast({ type: 'success', message: `${modalAsset.name} için ${modalTargetPrice} ${modalAsset.unit} hedefine alarm kuruldu.` });
      setTimeout(() => setToast(null), 4000);

    } catch (error) {
      console.error("Alarm kayıt hatası:", error);
      setToast({ type: 'error', message: 'Alarm kurulurken bir hata oluştu.' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setShowAlarmModal(false);
      setModalTargetPrice('');
    }
  };

  const searchBg    = isDark ? "#071224"  : "#f1f5f9";
  const searchBorder= isDark ? "#1a2a46"  : "#e2e8f0";
  const cardBg      = isDark ? "#161b22"  : "#ffffff";
  const cardBorder  = isDark ? "#1f2937"  : "#e2e8f0";

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col relative transition-colors duration-300`}>
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isLoggedIn={isLoggedIn || localStorage.getItem("tradein_token")}
        handleLogout={handleLogout} user={null} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="flex flex-1 w-full">
        <Sidebar isOpen={isSidebarOpen} isLoggedIn={isLoggedIn || localStorage.getItem("tradein_token")} setIsLoggedIn={setIsLoggedIn} />

        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          <div className="flex flex-1 w-full gap-6">
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

              {/* Kategori filtreleri (Statik) */}
              <div className="flex flex-wrap gap-3 mb-8">
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

              {/* Tablo başlığı */}
              <div className={`hidden lg:grid grid-cols-[2.4fr_1.2fr_1fr_1fr_1fr_0.8fr_1fr] gap-6 px-6 mb-4 text-sm ${t.textMuted}`}>
                <div>Varlık</div><div>Fiyat</div><div>24s Değişim</div>
                <div>Piyasa Değeri</div><div>Hacim (24s)</div><div>Grafik</div><div>İşlemler</div>
              </div>

              {/* Satırlar */}
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3,4].map(i => (
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
                            {/* 🚀 TREND VE RİSK YAZILARI BURADAN KALDIRILDI! */}
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
                          {item.change >= 0 ? "↗︎ ↗︎ ↗︎" : "↘︎ ↘︎ ↘︎"}
                        </div>

                        {/* İşlemler */}
                        <div className="flex items-center gap-4 justify-between">
                          {(isLoggedIn || localStorage.getItem("tradein_token")) && (
                            <button
                              onClick={() => handleAlarmClick(item.symbol)}
                              title={`${item.symbol} için alarm kur`}
                              className={`transition ${alarmSymbols.includes(item.symbol) ? "text-blue-400" : `${t.textSecond} hover:text-blue-400`}`}>
                              <Bell size={20} fill={alarmSymbols.includes(item.symbol) ? "#60a5fa" : "transparent"} />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => setSelectedAssetForChart({
                              name: item.name || item.symbol,
                              unit: item.category === "Kripto" ? "USD" : "TRY", 
                              icon: item.symbol === 'XAU/TRY (Gr)' ? '🟡' : (item.category === "Döviz" ? "💵" : "📊"), 
                              current_price: item.rawPrice || parseFloat(item.price.replace(/[^0-9.-]+/g,"")) || 100 
                            })}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap cursor-pointer shadow-lg"
                          >
                            Detay / Grafik
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="hidden xl:block shrink-0 sticky top-6 h-fit">
                <ChatBox currentUsername={localStorage.getItem('tradein_username') || "Misafir"} />
            </div>

          </div>
        </main>
      </div>

      {/* Alarm Kurma Popup */}
      {showAlarmModal && (
        <AlarmModalInMarkets
          t={t} asset={modalAsset} setAsset={setModalAsset}
          targetPrice={modalTargetPrice} setTargetPrice={setModalTargetPrice}
          condition={modalCondition} setCondition={setModalCondition}
          notifyEmail={modalNotifyEmail} setNotifyEmail={setModalNotifyEmail}
          notifyBrowser={modalNotifyBrowser} setNotifyBrowser={setModalNotifyBrowser}
          dropdownOpen={modalDropdownOpen} setDropdownOpen={setModalDropdownOpen}
          onClose={() => { setShowAlarmModal(false); setModalTargetPrice(''); }}
          onCreate={handleModalCreate}
          masterNotifEnabled={isMasterPriceNotifOn}
          currentPrice={assetPrices[modalAsset.name]}
          formatPrice={formatPrice}
        />
      )}

      {selectedAssetForChart && (
        <AssetDetailModal
          asset={selectedAssetForChart}
          currentPrice={selectedAssetForChart.current_price}
          onClose={() => setSelectedAssetForChart(null)}
          theme={theme}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl transition-all
          ${toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          <span className="text-lg">{toast.type === 'success' ? '🔔' : '❌'}</span>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// Markets içi assetTypes (Alarm Modal için)
const ASSET_TYPES = [
  { name: "Bitcoin", icon: "₿",  color: "#f7931a", unit: "USD"    },
  { name: "Dolar",   icon: "$",  color: "#4ade80", unit: "TRY"    },
  { name: "Euro",    icon: "€",  color: "#60a5fa", unit: "TRY"    },
  { name: "Sterlin", icon: "£",  color: "#a78bfa", unit: "TRY"    },
  { name: "Altın",   icon: "🟡", color: "#fbbf24", unit: "TRY/gr" },
  { name: "Borsa",   icon: "📈", color: "#34d399", unit: "BIST"   },
];

// Alarm Modal
function AlarmModalInMarkets({ t, asset, setAsset, targetPrice, setTargetPrice, condition, setCondition, notifyEmail, setNotifyEmail, notifyBrowser, setNotifyBrowser, dropdownOpen, setDropdownOpen, onClose, onCreate, masterNotifEnabled, currentPrice, formatPrice }) {
  const valid = targetPrice && !isNaN(Number(targetPrice)) && Number(targetPrice) > 0;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-md rounded-2xl border border-blue-500/30 ${t.modalBg} shadow-2xl p-6 transition-colors duration-300`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-blue-400" />
            <h2 className={`text-lg font-bold ${t.textPrimary}`}>Yeni Alarm Kur</h2>
          </div>
          <button onClick={onClose} className={`p-1.5 ${t.textMuted} hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10`}>
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <label className={`block text-xs font-semibold ${t.textMuted} mb-2 uppercase tracking-wider`}>Varlık</label>
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full flex items-center justify-between gap-3 rounded-xl border ${t.inputBorder} ${t.inputBg} px-4 py-3 text-sm ${t.textPrimary} hover:border-blue-500/50 transition-colors`}>
              <div className="flex items-center gap-2">
                <span>{asset.icon}</span>
                <span className="font-semibold">{asset.name}</span>
                <span className={`${t.textMuted} text-xs`}>({asset.unit})</span>
              </div>
              <ChevronDown size={16} className={`${t.textMuted} transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className={`absolute top-full mt-1 w-full rounded-xl border ${t.cardBorder} ${t.dropdownBg} overflow-hidden z-10 shadow-xl`}>
                {ASSET_TYPES.map(a => (
                  <button key={a.name} onClick={() => { setAsset(a); setDropdownOpen(false); }}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm ${t.hoverBg} transition-colors text-left`}>
                    <span>{a.icon}</span>
                    <span className={`font-semibold ${t.textPrimary}`}>{a.name}</span>
                    <span className={`${t.textMuted} text-xs ml-auto`}>{a.unit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {currentPrice && <p className={`text-xs ${t.textMuted} mt-1.5 px-1`}>Anlık: <span style={{ color: asset.color }} className="font-semibold">{formatPrice(currentPrice)} {asset.unit}</span></p>}
        </div>

        <div className="mb-4">
          <label className={`block text-xs font-semibold ${t.textMuted} mb-2 uppercase tracking-wider`}>Koşul</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["above", "Üzerine Çıkınca", "border-emerald-500/50 bg-emerald-500/15 text-emerald-400", TrendingUp],
              ["below", "Altına Düşünce", "border-red-500/50 bg-red-500/15 text-red-400", TrendingDown]
            ].map(([val, label, activeClasses, Icon]) => (
              <button key={val} onClick={() => setCondition(val)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  condition === val
                    ? activeClasses
                    : `${t.inputBorder} ${t.inputBg} ${t.textSecond} hover:border-gray-500`}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className={`block text-xs font-semibold ${t.textMuted} mb-2 uppercase tracking-wider`}>Hedef Fiyat ({asset.unit})</label>
          <div className={`flex items-center rounded-xl border ${t.inputBorder} ${t.inputBg} px-4 focus-within:border-blue-500 transition-colors`}>
            <Activity size={16} className={`${t.textMuted} mr-2 flex-shrink-0`} />
            <input type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="Örn: 35.50"
              className={`h-12 flex-1 bg-transparent text-sm ${t.textPrimary} outline-none placeholder-slate-500`} />
            <span className={`text-xs ${t.textMuted}`}>{asset.unit}</span>
          </div>
        </div>

        <div className="mb-6">
          <label className={`block text-xs font-semibold ${t.textMuted} mb-3 uppercase tracking-wider`}>Bildirim Kanalları</label>
          
          {!masterNotifEnabled && (
            <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <Target size={14} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400 font-medium leading-relaxed">
                Ayarlar sayfasından ana fiyat bildirimlerini kapattığınız için bu kanallar şu an kilitlidir.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {[[notifyBrowser,setNotifyBrowser,Smartphone,"text-blue-400","Tarayıcı Bildirimi"],
              [notifyEmail,setNotifyEmail,Mail,"text-purple-400","E-posta Bildirimi"]].map(([val,setter,Icon,ic,lbl],i) => (
              
              <label key={i} className={`flex items-center justify-between p-3 rounded-xl border ${t.cardBorder} ${t.deepCardBg} transition-colors ${masterNotifEnabled ? 'cursor-pointer hover:border-gray-500' : 'opacity-50 cursor-not-allowed'}`}>
                <div className={`flex items-center gap-2.5 text-sm ${t.textSecond}`}><Icon size={16} className={ic} />{lbl}</div>
                
                <div onClick={() => { if(masterNotifEnabled) setter(!val) }} className={`w-10 h-5 rounded-full transition-all relative ${masterNotifEnabled ? 'cursor-pointer' : 'cursor-not-allowed'} ${val && masterNotifEnabled ? "bg-blue-600" : "bg-slate-600"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${(val && masterNotifEnabled) ? "left-5" : "left-0.5"}`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl border ${t.cardBorder} ${t.textSecond} hover:text-white hover:bg-slate-800 text-sm font-semibold transition-all`}>İptal</button>
          <button onClick={onCreate} disabled={!valid}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${valid ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20" : `bg-slate-800 text-slate-500 cursor-not-allowed`}`}>
            Alarmı Kur
          </button>
        </div>
      </div>
    </div>
  );
}

export default Markets;