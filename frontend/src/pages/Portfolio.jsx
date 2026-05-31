import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, LineChart, PlusCircle, Trash2, Wallet, X } from "lucide-react";
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import TickerTape from '../components/TickerTape'; // TICKERTAPE EKLENDI
import { useTheme, getThemeClasses } from '../context/ThemeContext';

const assetTypes = [
  { name: "Borsa", icon: <LineChart size={14} />, unit: "Lot" },
  { name: "Altın", icon: "🟡", unit: "gr" },
  { name: "Gümüş", icon: "⚪", unit: "gr" },
  { name: "Bitcoin", icon: "₿", unit: "BTC" },
  { name: "Dolar", icon: "$", unit: "USD" },
  { name: "Euro", icon: "€", unit: "EUR" },
  { name: "Sterlin", icon: "£", unit: "GBP" },
];

function getNowDate(dateString = null) {
  const dateObj = dateString ? new Date(dateString) : new Date();
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(dateObj);
}

function Portfolio({ isLoggedIn, setIsLoggedIn }) {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(assetTypes[4]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("tradein_token");
    setIsLoggedIn(false);
    setUser(null);
  };

  useEffect(() => { fetchPortfolio(); fetchUser(); }, []);

  async function fetchUser() {
    const token = localStorage.getItem("tradein_token");
    if (token) {
      try {
        const response = await axios.get('http://127.0.0.1:8000/profilim', { headers: { Authorization: `Bearer ${token}` } });
        setUser({ name: response.data.name });
        if (!isLoggedIn) setIsLoggedIn(true);
      } catch (error) {
        if (error.response?.status === 401) handleLogout();
      }
    }
  }

  async function fetchPortfolio() {
    const token = localStorage.getItem("tradein_token");
    if (!token) { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await axios.get('http://127.0.0.1:8000/portfoyum', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.mesaj) {
        setAssets([]);
      } else {
        setAssets(res.data.map(item => {
          const foundType = assetTypes.find(a => a.name === item.asset_name);
          return { id: item.id, name: item.asset_name, amount: parseFloat(item.quantity), unit: foundType ? foundType.unit : "", created_at: item.created_at ? getNowDate(item.created_at) : getNowDate() };
        }));
      }
    } catch (error) {
      setAssets([]);
      if (error.response?.status === 401) handleLogout();
    } finally { setLoading(false); }
  }

  const totalAmount = useMemo(() => assets.reduce((sum, item) => sum + Number(item.amount || 0), 0), [assets]);
  const sortedAssets = useMemo(() => [...assets].sort((a, b) => Number(b.id) - Number(a.id)), [assets]);
  const assetWithPercentages = useMemo(() => sortedAssets.map(item => {
    const percentage = totalAmount > 0 ? (Number(item.amount || 0) / totalAmount) * 100 : 0;
    return { ...item, percentage: Number(percentage.toFixed(0)) };
  }), [sortedAssets, totalAmount]);
  const biggestAsset = useMemo(() => assetWithPercentages.length === 0 ? null : [...assetWithPercentages].sort((a, b) => b.percentage - a.percentage)[0], [assetWithPercentages]);
  const lastAddedAsset = assetWithPercentages[0] || null;
  const addButtonDisabled = !amount || Number(String(amount).replace(",", ".")) <= 0;

  function formatAmount(value) {
    const number = Number(value);
    if (Number.isNaN(number)) return value;
    return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4 }).format(number);
  }

  function getAssetIcon(assetName) {
    const found = assetTypes.find(item => item.name === assetName);
    return found?.icon || <Wallet size={18} />;
  }

  async function handleAddAsset() {
    const numericAmount = Number(String(amount).replace(",", "."));
    const token = localStorage.getItem("tradein_token");
    if (!selectedAsset) { setErrorMessage("Lütfen bir varlık türü seç."); return; }
    if (!numericAmount || numericAmount <= 0) { setErrorMessage("Lütfen geçerli bir miktar gir."); return; }
    try {
      setErrorMessage("");
      await axios.post('http://127.0.0.1:8000/portfoy-ekle', { asset_name: selectedAsset.name, quantity: numericAmount }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMessage(`${selectedAsset.name} portföyünüze başarıyla eklendi.`);
      setAmount("");
      fetchPortfolio();
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
      else setErrorMessage("Varlık eklenirken bir hata oluştu.");
    }
  }

  async function handleDeleteAsset(id) {
    const token = localStorage.getItem("tradein_token");
    try {
      await axios.delete(`http://127.0.0.1:8000/portfoy-sil/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAssets(prev => prev.filter(item => item.id !== id));
      setSuccessMessage("Varlık portföyünüzden kaldırıldı.");
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
      else setErrorMessage("Varlık silinemedi.");
    }
  }

  const hasLocalToken = !!localStorage.getItem("tradein_token");
  const isUserReallyLoggedIn = isLoggedIn || hasLocalToken;

  if (!isUserReallyLoggedIn) {
    return (
      <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col items-center justify-center p-4 transition-colors duration-300`}>
        <Wallet size={64} className="text-blue-500 mb-6 opacity-50" />
        <h2 className="text-2xl font-black mb-2">Portföyünü Yönet</h2>
        <p className={`${t.textSecond} mb-8`}>Varlıklarını takip etmek için giriş yapmalısın.</p>
        <Link to="/login" className="bg-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors text-white">Giriş Yap</Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col relative transition-colors duration-300`}>
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isLoggedIn={isUserReallyLoggedIn} handleLogout={handleLogout} user={user} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      {/* TICKERTAPE BURAYA EKLENDI */}
      <TickerTape />

      <div className="flex flex-1 w-full">
        <Sidebar isOpen={isSidebarOpen} isLoggedIn={isUserReallyLoggedIn} setIsLoggedIn={setIsLoggedIn} />

        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          <h1 className={`mb-5 text-3xl font-bold tracking-tight ${t.textPrimary}`}>Portföyüm</h1>

          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard t={t} icon={<Wallet size={28} />} title="Toplam Varlık Sayısı" value={assetWithPercentages.length} desc={assetWithPercentages.length > 0 ? "Farklı varlık türü" : "Henüz varlık eklenmedi"} />
            <SummaryCard t={t} icon={<LineChart size={30} />} title="En Büyük Varlık" value={biggestAsset ? biggestAsset.name : "-"} desc={biggestAsset ? `Portföy Oranı: %${biggestAsset.percentage}` : "Henüz varlık eklenmedi"} />
            <SummaryCard t={t} icon={<PlusCircle size={31} />} title="Son Eklenen Varlık" value={lastAddedAsset ? lastAddedAsset.name : "-"} desc={lastAddedAsset ? "Kayıtlı Varlık" : "Henüz varlık eklenmedi"} />
            <SummaryCard t={t} icon={<CalendarDays size={30} />} title="Durum" value={assets.length > 0 ? "Aktif" : "Boş"} desc={assets.length === 0 ? "Henüz varlık eklenmedi" : ""} />
          </section>

          {loading ? (
            <div className={`rounded-2xl border ${t.cardBorder} ${t.cardBg} p-8 ${t.textSecond} text-center animate-pulse`}>Portföy verileri yükleniyor...</div>
          ) : (
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.4fr]">
              {/* Varlık Ekle */}
              <div className={`rounded-2xl border ${t.cardBorder} ${t.cardBg} p-5 shadow`}>
                <h2 className={`text-xl font-semibold ${t.textPrimary}`}>Varlık Ekle</h2>
                <p className={`mt-1 text-sm ${t.textSecond}`}>Eklemek istediğin varlık türünü seç ve miktarını gir.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {assetTypes.map(asset => (
                    <button
                      key={asset.name}
                      onClick={() => { setSelectedAsset(asset); setErrorMessage(""); }}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        selectedAsset?.name === asset.name
                          ? "border-blue-400 bg-blue-600 text-white shadow-lg"
                          : `${t.cardBorder} ${t.deepCardBg} ${t.textSecond} hover:border-blue-500/60 hover:text-blue-500`
                      }`}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${t.cardBg2} text-xs`}>{asset.icon}</span>
                      {asset.name}
                    </button>
                  ))}
                </div>

                <div className={`mt-4 rounded-xl border ${t.deepCardBorder} ${t.deepCardBg} p-4`}>
                  <div className={`mb-4 flex items-center gap-2 text-sm ${t.textSecond}`}>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">{selectedAsset?.icon}</span>
                    Seçilen varlık: <span className="font-semibold text-blue-500">{selectedAsset?.name}</span>
                  </div>
                  <label className={`mb-2 block text-sm ${t.textSecond}`}>Miktar giriniz</label>
                  <div className={`flex items-center rounded-lg border ${t.inputBorder} ${t.inputBg} px-3`}>
                    <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" placeholder="0,00" className={`h-11 flex-1 bg-transparent text-sm ${t.textPrimary} outline-none placeholder:${t.textMuted}`} />
                    <span className={`text-xs ${t.textSecond}`}>{selectedAsset?.unit}</span>
                  </div>
                  <button
                    onClick={handleAddAsset}
                    disabled={addButtonDisabled || loading}
                    className={`mt-4 h-11 w-full rounded-lg text-sm font-medium transition ${addButtonDisabled ? `cursor-not-allowed ${t.cardBg2} ${t.textMuted}` : "bg-blue-600 text-white hover:bg-blue-500"}`}
                  >
                    Portföye Ekle
                  </button>
                </div>

                {errorMessage && <AlertBox t={t} type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}
                {successMessage && <AlertBox t={t} type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}
              </div>

              {/* Mevcut Portföy */}
              <div className={`rounded-2xl border ${t.cardBorder} ${t.cardBg} p-5 shadow`}>
                {assetWithPercentages.length > 0 ? (
                  <>
                    <div className="mb-5">
                      <h2 className={`text-xl font-semibold ${t.textPrimary}`}>Mevcut Portföyünüz</h2>
                      <p className={`mt-1 text-sm ${t.textSecond}`}>Varlıklarınız en son eklenene göre sıralanır.</p>
                    </div>
                    <div className="space-y-3">
                      {assetWithPercentages.map(item => (
                        <PortfolioAssetCard key={item.id} t={t} item={item} icon={getAssetIcon(item.name)} formatAmount={formatAmount} onDelete={() => handleDeleteAsset(item.id)} />
                      ))}
                    </div>
                    <p className={`mt-4 text-sm ${t.textSecond}`}>
                      Toplam Portföy Miktarı: <span className={t.textPrimary}>{formatAmount(totalAmount)}</span>
                    </p>
                  </>
                ) : (
                  <EmptyPortfolio t={t} />
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function SummaryCard({ t, icon, title, value, desc }) {
  return (
    <div className={`group rounded-2xl border ${t.cardBorder} ${t.cardBg} p-5 shadow transition hover:border-blue-400/60`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-16 w-16 items-center justify-center rounded-xl border ${t.cardBorder} ${t.deepCardBg} text-blue-400 group-hover:text-blue-300`}>
          {icon}
        </div>
        <div>
          <p className={`text-sm ${t.textSecond}`}>{title}</p>
          <p className="mt-1 text-2xl font-bold text-blue-500">{value}</p>
          {desc && <p className={`mt-1 text-sm ${t.textMuted}`}>{desc}</p>}
        </div>
      </div>
    </div>
  );
}

function PortfolioAssetCard({ t, item, icon, formatAmount, onDelete }) {
  return (
    <div className={`rounded-xl border ${t.deepCardBorder} ${t.deepCardBg} p-4 transition hover:border-blue-500/40`}>
      <div className="grid grid-cols-[1fr_auto] gap-4 md:grid-cols-[1.1fr_0.9fr_0.9fr_auto] md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">{icon}</div>
          <div>
            <h3 className={`font-semibold ${t.textPrimary}`}>{item.name}</h3>
            <p className={`text-sm ${t.textSecond}`}>{formatAmount(item.amount)} {item.unit}</p>
          </div>
        </div>
        <div>
          <p className={`text-sm ${t.textMuted}`}>Portföy Oranı</p>
          <p className="text-2xl font-bold text-blue-500">%{item.percentage}</p>
        </div>
        <div className="hidden md:block">
          <p className={`text-sm ${t.textMuted}`}>En Son Eklenme Tarihi</p>
          <p className={`text-sm ${t.textSecond}`}>{item.created_at}</p>
        </div>
        <button onClick={onDelete} className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition hover:bg-red-500/20" title="Varlığı Sil">
          <Trash2 size={18} />
        </button>
      </div>
      <div className={`mt-3 h-2 overflow-hidden rounded-full ${t.deepCardBg} border ${t.deepCardBorder}`}>
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${item.percentage}%` }} />
      </div>
    </div>
  );
}

function EmptyPortfolio({ t }) {
  return (
    <div className={`flex min-h-[360px] flex-col items-center justify-center rounded-2xl border ${t.cardBorder} ${t.deepCardBg} px-6 text-center`}>
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600/10 text-blue-400 shadow-lg">
        <Wallet size={52} />
      </div>
      <h2 className={`text-2xl font-bold ${t.textPrimary}`}>Henüz portföyüne varlık eklemedin.</h2>
      <p className={`mt-3 max-w-md text-sm leading-6 ${t.textSecond}`}>
        Yan taraftaki varlık türlerinden birini seçerek portföyünü oluşturmaya başlayabilirsin.
      </p>
    </div>
  );
}

function AlertBox({ t, type, message, onClose }) {
  const isSuccess = type === "success";
  return (
    <div className={`mt-4 flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${isSuccess ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-red-500/30 bg-red-500/10 text-red-500"}`}>
      <div className="flex items-center gap-2">
        {isSuccess ? <CheckCircle2 size={18} /> : <X size={18} />}
        {message}
      </div>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}

export default Portfolio;