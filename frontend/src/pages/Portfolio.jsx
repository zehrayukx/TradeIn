import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  LineChart,
  PlusCircle,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const assetTypes = [
  { name: "Borsa", icon: <LineChart size={14} />, unit: "Lot" },
  { name: "Altın", icon: "🟡", unit: "gr" },
  { name: "Gümüş", icon: "⚪", unit: "gr" },
  { name: "Bitcoin", icon: "₿", unit: "BTC" },
  { name: "Dolar", icon: "$", unit: "USD" },
  { name: "Euro", icon: "€", unit: "EUR" },
  { name: "Sterlin", icon: "£", unit: "GBP" },
];

// 🚀 YENİ: Türkçe ve saatli tarih oluşturucu fonksiyon
function getNowDate(dateString = null) {
  const dateObj = dateString ? new Date(dateString) : new Date();
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

function Portfolio({ isLoggedIn, setIsLoggedIn }) {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(assetTypes[4]); // Default: Dolar
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  // 🚀 KİLİT ÇÖZÜM 1: Navbar'ın çökmemesi için arama state'lerini buraya da ekledik
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("tradein_token");
    setIsLoggedIn(false);
    setUser(null);
  };

  useEffect(() => {
    fetchPortfolio();
    fetchUser();
  }, []);

  async function fetchUser() {
    const token = localStorage.getItem("tradein_token");
    if (token) {
      try {
        const response = await axios.get('http://127.0.0.1:8000/profilim', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setUser({ name: response.data.name }); 
        if (!isLoggedIn) setIsLoggedIn(true); 
      } catch (error) { 
        if (error.response?.status === 401) {
          handleLogout();
        }
      }
    }
  }

  async function fetchPortfolio() {
    const token = localStorage.getItem("tradein_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get('http://127.0.0.1:8000/portfoyum', { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.data.mesaj) {
        setAssets([]); 
      } else {
        const formattedData = res.data.map(item => {
          const foundType = assetTypes.find(a => a.name === item.asset_name);
          return {
            id: item.id,
            name: item.asset_name,
            amount: parseFloat(item.quantity),
            unit: foundType ? foundType.unit : "",
            // 🚀 KİLİT ÇÖZÜM 2: Veritabanında tarih varsa onu çevir, yoksa bugünün tarihini bas
            created_at: item.created_at ? getNowDate(item.created_at) : getNowDate()
          };
        });
        setAssets(formattedData);
      }
    } catch (error) {
      console.error("Portföy çekilemedi:", error);
      setAssets([]);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }

  const totalAmount = useMemo(() => {
    return assets.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [assets]);

  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => Number(b.id) - Number(a.id));
  }, [assets]);

  const assetWithPercentages = useMemo(() => {
    return sortedAssets.map((item) => {
      const percentage = totalAmount > 0 ? (Number(item.amount || 0) / totalAmount) * 100 : 0;
      return { ...item, percentage: Number(percentage.toFixed(0)) };
    });
  }, [sortedAssets, totalAmount]);

  const biggestAsset = useMemo(() => {
    if (assetWithPercentages.length === 0) return null;
    return [...assetWithPercentages].sort((a, b) => b.percentage - a.percentage)[0];
  }, [assetWithPercentages]);

  const lastAddedAsset = assetWithPercentages[0] || null;
  const lastUpdateDate = lastAddedAsset?.created_at || lastAddedAsset?.createdAt || "-";
  const addButtonDisabled = !amount || Number(String(amount).replace(",", ".")) <= 0;

  function formatAmount(value) {
    const number = Number(value);
    if (Number.isNaN(number)) return value;
    return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4 }).format(number);
  }

  function getAssetIcon(assetName) {
    const found = assetTypes.find((item) => item.name === assetName);
    return found?.icon || <Wallet size={18} />;
  }

  async function handleAddAsset() {
    const numericAmount = Number(String(amount).replace(",", "."));
    const token = localStorage.getItem("tradein_token");

    if (!selectedAsset) { setErrorMessage("Lütfen bir varlık türü seç."); return; }
    if (!numericAmount || numericAmount <= 0) { setErrorMessage("Lütfen geçerli bir miktar gir."); return; }

    try {
      setErrorMessage("");
      await axios.post('http://127.0.0.1:8000/portfoy-ekle', {
        asset_name: selectedAsset.name,
        quantity: numericAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      await axios.delete(`http://127.0.0.1:8000/portfoy-sil/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssets((prev) => prev.filter((item) => item.id !== id));
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
      <div className="min-h-screen bg-[#0a0f1d] text-white flex flex-col items-center justify-center p-4">
        <Wallet size={64} className="text-blue-500 mb-6 opacity-50" />
        <h2 className="text-2xl font-black mb-2">Portföyünü Yönet</h2>
        <p className="text-gray-400 mb-8">Varlıklarını takip etmek için giriş yapmalısın.</p>
        <Link to="/login" className="bg-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">Giriş Yap</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col relative">
      {/* 🚀 NAVBAR'A ARAMA STATE'LERİNİ PASLADIK! */}
      <Navbar 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isLoggedIn={isUserReallyLoggedIn} 
        handleLogout={handleLogout} 
        user={user} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      <div className="flex flex-1 max-w-[1440px] w-full mx-auto">
        <Sidebar isOpen={isSidebarOpen} isLoggedIn={isUserReallyLoggedIn} setIsLoggedIn={setIsLoggedIn} />

        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          
          <h1 className="mb-5 text-3xl font-bold tracking-tight text-white">Portföyüm</h1>

          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon={<Wallet size={28} />} title="Toplam Varlık Sayısı" value={assetWithPercentages.length} desc={assetWithPercentages.length > 0 ? "Farklı varlık türü" : "Henüz varlık eklenmedi"} />
            <SummaryCard icon={<LineChart size={30} />} title="En Büyük Varlık" value={biggestAsset ? biggestAsset.name : "-"} desc={biggestAsset ? `Portföy Oranı: %${biggestAsset.percentage}` : "Henüz varlık eklenmedi"} />
            <SummaryCard icon={<PlusCircle size={31} />} title="Son Eklenen Varlık" value={lastAddedAsset ? lastAddedAsset.name : "-"} desc={lastAddedAsset ? "Kayıtlı Varlık" : "Henüz varlık eklenmedi"} />
            <SummaryCard icon={<CalendarDays size={30} />} title="Durum" value={assets.length > 0 ? "Aktif" : "Boş"} desc={assets.length === 0 ? "Henüz varlık eklenmedi" : ""} />
          </section>

          {loading ? (
            <div className="rounded-2xl border border-blue-500/20 bg-[#07111f] p-8 text-slate-400 text-center animate-pulse">Portföy verileri yükleniyor...</div>
          ) : (
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.4fr]">
              <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-[#08111f] to-[#050b16] p-5 shadow-[0_0_30px_rgba(37,99,235,0.08)]">
                <h2 className="text-xl font-semibold text-white">Varlık Ekle</h2>
                <p className="mt-1 text-sm text-slate-400">Eklemek istediğin varlık türünü seç ve miktarını gir.</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {assetTypes.map((asset) => (
                    <button
                      key={asset.name}
                      onClick={() => { setSelectedAsset(asset); setErrorMessage(""); }}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${selectedAsset?.name === asset.name ? "border-blue-400 bg-blue-600 text-white shadow-[0_0_18px_rgba(37,99,235,0.35)]" : "border-slate-700 bg-[#0b1424] text-slate-300 hover:border-blue-500/60 hover:text-blue-300"}`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs">{asset.icon}</span>
                      {asset.name}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-[#07101e] p-4">
                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">{selectedAsset?.icon}</span>
                    Seçilen varlık: <span className="font-semibold text-blue-400">{selectedAsset?.name}</span>
                  </div>

                  <label className="mb-2 block text-sm text-slate-400">Miktar giriniz</label>
                  <div className="flex items-center rounded-lg border border-slate-700 bg-[#050b16] px-3">
                    <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" placeholder="0,00" className="h-11 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
                    <span className="text-xs text-slate-400">{selectedAsset?.unit}</span>
                  </div>

                  <button
                    onClick={handleAddAsset}
                    disabled={addButtonDisabled || loading}
                    className={`mt-4 h-11 w-full rounded-lg text-sm font-medium transition ${addButtonDisabled ? "cursor-not-allowed bg-slate-700/60 text-slate-500" : "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:bg-blue-500"}`}
                  >
                    Portföye Ekle
                  </button>
                </div>

                {errorMessage && <AlertBox type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}
                {successMessage && <AlertBox type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#08111f] to-[#050b16] p-5 shadow-[0_0_30px_rgba(37,99,235,0.08)]">
                {assetWithPercentages.length > 0 ? (
                  <>
                    <div className="mb-5 flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white">Mevcut Portföyünüz</h2>
                        <p className="mt-1 text-sm text-slate-400">Varlıklarınız en son eklenene göre sıralanır.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {assetWithPercentages.map((item) => (
                        <PortfolioAssetCard
                          key={item.id}
                          item={item}
                          icon={getAssetIcon(item.name)}
                          formatAmount={formatAmount}
                          onDelete={() => handleDeleteAsset(item.id)}
                        />
                      ))}
                    </div>

                    <p className="mt-4 text-sm text-slate-400">
                      Toplam Portföy Miktarı: <span className="text-slate-200">{formatAmount(totalAmount)}</span>
                    </p>
                  </>
                ) : (
                  <EmptyPortfolio />
                )}
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}

// --- ALTKOMPONENTLER ---

function SummaryCard({ icon, title, value, desc }) {
  return (
    <div className="group rounded-2xl border border-blue-500/30 bg-gradient-to-br from-[#0b1628] to-[#060b14] p-5 shadow-[0_0_25px_rgba(37,99,235,0.08)] transition hover:border-blue-400/60 hover:shadow-[0_0_28px_rgba(37,99,235,0.18)]">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-700 bg-[#07111f] text-blue-400 group-hover:text-blue-300">
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-300">{title}</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{value}</p>
          {desc && <p className="mt-1 text-sm text-slate-400">{desc}</p>}
        </div>
      </div>
    </div>
  );
}

function PortfolioAssetCard({ item, icon, formatAmount, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#07101e]/80 p-4 transition hover:border-blue-500/40 hover:bg-[#0a1526]">
      <div className="grid grid-cols-[1fr_auto] gap-4 md:grid-cols-[1.1fr_0.9fr_0.9fr_auto] md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-white">{item.name}</h3>
            <p className="text-sm text-slate-300">{formatAmount(item.amount)} {item.unit}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-400">Portföy Oranı</p>
          <p className="text-2xl font-bold text-blue-400">%{item.percentage}</p>
        </div>

        <div className="hidden md:block">
          <p className="text-sm text-slate-400">En Son Eklenme Tarihi</p>
          <p className="text-sm text-slate-200">{item.created_at}</p>
        </div>

        <button
          onClick={onDelete}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
          title="Varlığı Sil"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#020817]">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${item.percentage}%` }} />
      </div>
    </div>
  );
}

function EmptyPortfolio() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#07101e] px-6 text-center">
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600/10 text-blue-400 shadow-[0_0_35px_rgba(37,99,235,0.25)]">
        <Wallet size={52} />
      </div>
      <h2 className="text-2xl font-bold text-white">Henüz portföyüne varlık eklemedin.</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
        Yan taraftaki varlık türlerinden birini seçerek portföyünü oluşturmaya başlayabilirsin.
      </p>
    </div>
  );
}

function AlertBox({ type, message, onClose }) {
  const isSuccess = type === "success";
  return (
    <div className={`mt-4 flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${isSuccess ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
      <div className="flex items-center gap-2">
        {isSuccess ? <CheckCircle2 size={18} /> : <X size={18} />}
        {message}
      </div>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}

export default Portfolio;