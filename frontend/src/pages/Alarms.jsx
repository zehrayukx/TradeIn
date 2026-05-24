import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Mail,
  Smartphone,
  ChevronDown,
  Activity,
  Target,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const assetTypes = [
  { name: "Bitcoin", icon: "₿", color: "#f7931a", unit: "USD" },
  { name: "Dolar", icon: "$", color: "#4ade80", unit: "TRY" },
  { name: "Euro", icon: "€", color: "#60a5fa", unit: "TRY" },
  { name: "Sterlin", icon: "£", color: "#a78bfa", unit: "TRY" },
  { name: "Altın", icon: "🟡", color: "#fbbf24", unit: "TRY/gr" },
  { name: "Gümüş", icon: "⚪", color: "#94a3b8", unit: "TRY/gr" },
  { name: "Borsa", icon: "📈", color: "#34d399", unit: "BIST" },
];

// Simüle edilmiş anlık fiyatlar (gerçek API'ye bağlanana kadar)
const mockPrices = {
  Bitcoin: 2850000,
  Dolar: 32.45,
  Euro: 35.12,
  Sterlin: 41.22,
  Altın: 1985.5,
  Gümüş: 24.8,
  Borsa: 10842,
};

function Alarms({ isLoggedIn, setIsLoggedIn }) {
  const [alarms, setAlarms] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tradein_alarms") || "[]");
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tradein_alarm_notifs") || "[]");
    } catch {
      return [];
    }
  });

  const [prices, setPrices] = useState(mockPrices);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("alarms"); // 'alarms' | 'notifications'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(assetTypes[0]);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState("above"); // 'above' | 'below'
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyBrowser, setNotifyBrowser] = useState(true);
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const priceIntervalRef = useRef(null);
  const checkedAlarmsRef = useRef(new Set());

  // Kullanıcı bilgisi
  useEffect(() => {
    const token = localStorage.getItem("tradein_token");
    if (token) {
      setUser({ name: "Kullanıcı" }); // gerçek uygulamada API çağrısı
    }
  }, []);

  // Fiyatları localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem("tradein_alarms", JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    localStorage.setItem("tradein_alarm_notifs", JSON.stringify(notifications));
  }, [notifications]);

  // Simüle edilmiş fiyat dalgalanması
  useEffect(() => {
    priceIntervalRef.current = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          const change = (Math.random() - 0.48) * next[key] * 0.003;
          next[key] = Math.max(0.01, +(next[key] + change).toFixed(2));
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(priceIntervalRef.current);
  }, []);

  // Alarm kontrolü
  useEffect(() => {
    alarms.forEach((alarm) => {
      if (!alarm.active || checkedAlarmsRef.current.has(alarm.id)) return;
      const currentPrice = prices[alarm.asset];
      if (currentPrice === undefined) return;

      const triggered =
        alarm.condition === "above"
          ? currentPrice >= alarm.targetPrice
          : currentPrice <= alarm.targetPrice;

      if (triggered) {
        checkedAlarmsRef.current.add(alarm.id);
        triggerAlarm(alarm, currentPrice);
      }
    });
  }, [prices, alarms]);

  const triggerAlarm = useCallback((alarm, currentPrice) => {
    const notif = {
      id: Date.now(),
      alarmId: alarm.id,
      asset: alarm.asset,
      assetIcon: alarm.assetIcon,
      assetColor: alarm.assetColor,
      targetPrice: alarm.targetPrice,
      currentPrice,
      condition: alarm.condition,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [notif, ...prev]);

    // Alarmı pasife al
    setAlarms((prev) =>
      prev.map((a) => (a.id === alarm.id ? { ...a, active: false } : a))
    );

    // Tarayıcı bildirimi
    if (alarm.notifyBrowser && notifPermission === "granted") {
      new Notification("🔔 TradeIn Alarm!", {
        body: `${alarm.asset} ${alarm.condition === "above" ? "üstüne çıktı" : "altına düştü"}: ${formatPrice(currentPrice)} ${alarm.unit}`,
        icon: "/favicon.ico",
      });
    }
  }, [notifPermission]);

  const requestNotifPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const handleCreateAlarm = () => {
    if (!targetPrice || isNaN(Number(targetPrice)) || Number(targetPrice) <= 0) return;
    const alarm = {
      id: Date.now(),
      asset: selectedAsset.name,
      assetIcon: selectedAsset.icon,
      assetColor: selectedAsset.color,
      unit: selectedAsset.unit,
      targetPrice: Number(targetPrice),
      condition,
      notifyEmail,
      notifyBrowser,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setAlarms((prev) => [alarm, ...prev]);
    setShowCreateModal(false);
    setTargetPrice("");
    setCondition("above");
  };

  const handleDeleteAlarm = (id) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    checkedAlarmsRef.current.delete(id);
  };

  const handleToggleAlarm = (id) => {
    setAlarms((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          if (!a.active) checkedAlarmsRef.current.delete(id); // reaktive edince tekrar kontrol edilsin
          return { ...a, active: !a.active };
        }
        return a;
      })
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteNotif = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  function formatPrice(val) {
    return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(val);
  }

  function relativeTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dk önce`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} sa önce`;
    return `${Math.floor(hrs / 24)} gün önce`;
  }

  const hasLocalToken = !!localStorage.getItem("tradein_token");
  if (!isLoggedIn && !hasLocalToken) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-white flex flex-col items-center justify-center p-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600/10 text-blue-400 mb-6 shadow-[0_0_40px_rgba(37,99,235,0.2)]">
          <Bell size={48} />
        </div>
        <h2 className="text-2xl font-black mb-2">Alarmlarını Yönet</h2>
        <p className="text-gray-400 mb-8 text-center max-w-sm">
          Fiyat alarmları kurabilmek için giriş yapman gerekiyor.
        </p>
        <Link
          to="/login"
          className="bg-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col relative">
      <Navbar
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isLoggedIn={isLoggedIn || hasLocalToken}
        handleLogout={() => {
          localStorage.removeItem("tradein_token");
          setIsLoggedIn(false);
        }}
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex flex-1 w-full">
        <Sidebar
          isOpen={isSidebarOpen}
          isLoggedIn={isLoggedIn || hasLocalToken}
          setIsLoggedIn={setIsLoggedIn}
          alarmNotifCount={unreadCount}
        />

        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          {/* Başlık */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                <Bell size={28} className="text-blue-400" />
                Alarmlar
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Varlık fiyatlarına göre otomatik bildirim alın
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_28px_rgba(37,99,235,0.5)]"
            >
              <Plus size={18} />
              Alarm Kur
            </button>
          </div>

          {/* Canlı Fiyat Bandı */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {assetTypes.map((asset) => (
              <div
                key={asset.name}
                className="rounded-xl border border-slate-800 bg-[#07101e] px-3 py-2.5 flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{asset.icon}</span>
                  <span className="text-xs font-semibold text-slate-300">{asset.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: asset.color }}>
                  {formatPrice(prices[asset.name])}
                </span>
                <span className="text-[10px] text-slate-500">{asset.unit}</span>
              </div>
            ))}
          </div>

          {/* Tarayıcı Bildirimi İzni Uyarısı */}
          {notifPermission !== "granted" && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
              <div className="flex items-center gap-3 text-sm text-yellow-300">
                <AlertTriangle size={18} />
                Tarayıcı bildirimleri kapalı. Alarmlar tetiklendiğinde bildirim alamazsın.
              </div>
              <button
                onClick={requestNotifPermission}
                className="text-xs font-bold text-yellow-400 hover:text-yellow-300 border border-yellow-500/40 px-3 py-1.5 rounded-lg transition-colors"
              >
                İzin Ver
              </button>
            </div>
          )}

          {/* Sekmeler */}
          <div className="flex gap-1 mb-6 bg-[#07101e] border border-slate-800 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab("alarms")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "alarms"
                  ? "bg-blue-600 text-white shadow-[0_0_14px_rgba(37,99,235,0.35)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Alarmlarım
              {alarms.length > 0 && (
                <span className="ml-2 text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">
                  {alarms.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("notifications");
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === "notifications"
                  ? "bg-blue-600 text-white shadow-[0_0_14px_rgba(37,99,235,0.35)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Bildirimler
              {unreadCount > 0 && (
                <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Alarmlar Sekmesi */}
          {activeTab === "alarms" && (
            <div>
              {alarms.length === 0 ? (
                <EmptyAlarms onOpen={() => setShowCreateModal(true)} />
              ) : (
                <div className="space-y-3">
                  {alarms.map((alarm) => (
                    <AlarmCard
                      key={alarm.id}
                      alarm={alarm}
                      currentPrice={prices[alarm.asset]}
                      onDelete={() => handleDeleteAlarm(alarm.id)}
                      onToggle={() => handleToggleAlarm(alarm.id)}
                      formatPrice={formatPrice}
                      relativeTime={relativeTime}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bildirimler Sekmesi */}
          {activeTab === "notifications" && (
            <div>
              {notifications.length > 0 && (
                <div className="flex justify-end mb-3">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Tümünü okundu işaretle
                  </button>
                </div>
              )}
              {notifications.length === 0 ? (
                <EmptyNotifications />
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <NotificationCard
                      key={notif.id}
                      notif={notif}
                      onDelete={() => handleDeleteNotif(notif.id)}
                      formatPrice={formatPrice}
                      relativeTime={relativeTime}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Alarm Kurma Modal */}
      {showCreateModal && (
        <CreateAlarmModal
          assetTypes={assetTypes}
          selectedAsset={selectedAsset}
          setSelectedAsset={setSelectedAsset}
          targetPrice={targetPrice}
          setTargetPrice={setTargetPrice}
          condition={condition}
          setCondition={setCondition}
          notifyEmail={notifyEmail}
          setNotifyEmail={setNotifyEmail}
          notifyBrowser={notifyBrowser}
          setNotifyBrowser={setNotifyBrowser}
          assetDropdownOpen={assetDropdownOpen}
          setAssetDropdownOpen={setAssetDropdownOpen}
          currentPrice={prices[selectedAsset.name]}
          formatPrice={formatPrice}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateAlarm}
        />
      )}
    </div>
  );
}

// --- AlarmCard ---
function AlarmCard({ alarm, currentPrice, onDelete, onToggle, formatPrice, relativeTime }) {
  const isAbove = alarm.condition === "above";
  const progress = currentPrice
    ? isAbove
      ? Math.min(100, (currentPrice / alarm.targetPrice) * 100)
      : Math.min(100, (alarm.targetPrice / currentPrice) * 100)
    : 0;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        alarm.active
          ? "border-blue-500/30 bg-gradient-to-br from-[#08111f] to-[#050b16] shadow-[0_0_20px_rgba(37,99,235,0.06)]"
          : "border-slate-800 bg-[#07101e] opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* İkon */}
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-xl flex-shrink-0"
            style={{ backgroundColor: alarm.assetColor + "22", border: `1px solid ${alarm.assetColor}44` }}
          >
            {alarm.assetIcon}
          </div>

          {/* Bilgi */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-base">{alarm.asset}</span>
              <span
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isAbove
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}
              >
                {isAbove ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {isAbove ? "Üzerine çıkınca" : "Altına düşünce"}
              </span>
              {!alarm.active && (
                <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                  Tetiklendi
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm text-slate-400">
                Hedef:{" "}
                <span className="text-white font-semibold">
                  {formatPrice(alarm.targetPrice)} {alarm.unit}
                </span>
              </span>
              {currentPrice && (
                <span className="text-sm text-slate-400">
                  Şimdi:{" "}
                  <span style={{ color: alarm.assetColor }} className="font-semibold">
                    {formatPrice(currentPrice)} {alarm.unit}
                  </span>
                </span>
              )}
            </div>


            {/* Bildirim kanalları + tarih */}
            <div className="flex items-center gap-3 mt-2">
              {alarm.notifyBrowser && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Smartphone size={11} /> Tarayıcı
                </span>
              )}
              {alarm.notifyEmail && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Mail size={11} /> E-posta
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-slate-600">
                <Clock size={11} />
                {relativeTime(alarm.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggle}
            title={alarm.active ? "Alarmı durdur" : "Alarmı aktifleştir"}
            className={`p-2 rounded-lg border transition-all ${
              alarm.active
                ? "border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                : "border-slate-700 bg-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400"
            }`}
          >
            {alarm.active ? <BellOff size={16} /> : <Bell size={16} />}
          </button>
          <button
            onClick={onDelete}
            title="Alarmı sil"
            className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- NotificationCard ---
function NotificationCard({ notif, onDelete, formatPrice, relativeTime }) {
  const isAbove = notif.condition === "above";
  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        !notif.read
          ? "border-blue-500/40 bg-gradient-to-br from-[#08111f] to-[#050b16] shadow-[0_0_20px_rgba(37,99,235,0.08)]"
          : "border-slate-800 bg-[#07101e]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-lg flex-shrink-0"
            style={{
              backgroundColor: notif.assetColor + "22",
              border: `1px solid ${notif.assetColor}44`,
            }}
          >
            {notif.assetIcon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white">{notif.asset}</span>
              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse" />
              )}
              <span
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isAbove
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {isAbove ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                Alarm Tetiklendi
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Hedef{" "}
              <span className="text-white font-semibold">
                {formatPrice(notif.targetPrice)}
              </span>{" "}
              seviyesi geçildi. Anlık fiyat:{" "}
              <span style={{ color: notif.assetColor }} className="font-semibold">
                {formatPrice(notif.currentPrice)}
              </span>
            </p>
            <span className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <Clock size={11} />
              {relativeTime(notif.timestamp)}
            </span>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all flex-shrink-0"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

// --- CreateAlarmModal ---
function CreateAlarmModal({
  assetTypes, selectedAsset, setSelectedAsset,
  targetPrice, setTargetPrice, condition, setCondition,
  notifyEmail, setNotifyEmail, notifyBrowser, setNotifyBrowser,
  assetDropdownOpen, setAssetDropdownOpen,
  currentPrice, formatPrice, onClose, onCreate,
}) {
  const valid = targetPrice && !isNaN(Number(targetPrice)) && Number(targetPrice) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-blue-500/30 bg-[#08111f] shadow-[0_0_60px_rgba(37,99,235,0.2)] p-6">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white">Yeni Alarm Kur</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Varlık Seçimi */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Varlık
          </label>
          <div className="relative">
            <button
              onClick={() => setAssetDropdownOpen(!assetDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#07101e] px-4 py-3 text-sm text-white hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>{selectedAsset.icon}</span>
                <span className="font-semibold">{selectedAsset.name}</span>
                <span className="text-slate-500 text-xs">({selectedAsset.unit})</span>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${assetDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {assetDropdownOpen && (
              <div className="absolute top-full mt-1 w-full rounded-xl border border-slate-700 bg-[#07101e] overflow-hidden z-10 shadow-xl">
                {assetTypes.map((asset) => (
                  <button
                    key={asset.name}
                    onClick={() => { setSelectedAsset(asset); setAssetDropdownOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors text-left"
                  >
                    <span>{asset.icon}</span>
                    <span className="font-semibold text-white">{asset.name}</span>
                    <span className="text-slate-500 text-xs ml-auto">{asset.unit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {currentPrice && (
            <p className="text-xs text-slate-500 mt-1.5 px-1">
              Anlık fiyat:{" "}
              <span style={{ color: selectedAsset.color }} className="font-semibold">
                {formatPrice(currentPrice)} {selectedAsset.unit}
              </span>
            </p>
          )}
        </div>

        {/* Koşul */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Koşul
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCondition("above")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                condition === "above"
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-slate-700 bg-[#07101e] text-slate-400 hover:border-slate-600"
              }`}
            >
              <TrendingUp size={15} />
              Üzerine Çıkınca
            </button>
            <button
              onClick={() => setCondition("below")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                condition === "below"
                  ? "border-red-500/50 bg-red-500/15 text-red-400"
                  : "border-slate-700 bg-[#07101e] text-slate-400 hover:border-slate-600"
              }`}
            >
              <TrendingDown size={15} />
              Altına Düşünce
            </button>
          </div>
        </div>

        {/* Hedef Fiyat */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Hedef Fiyat ({selectedAsset.unit})
          </label>
          <div className="flex items-center rounded-xl border border-slate-700 bg-[#07101e] px-4 focus-within:border-blue-500 transition-colors">
            <Activity size={16} className="text-slate-500 mr-2 flex-shrink-0" />
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Örn: 35.50"
              className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
            <span className="text-xs text-slate-500">{selectedAsset.unit}</span>
          </div>
        </div>

        {/* Bildirim Kanalları */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            Bildirim Kanalları
          </label>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-[#07101e] cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-2.5 text-sm text-slate-300">
                <Smartphone size={16} className="text-blue-400" />
                Tarayıcı Bildirimi
              </div>
              <div
                onClick={() => setNotifyBrowser(!notifyBrowser)}
                className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${notifyBrowser ? "bg-blue-600" : "bg-slate-700"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${notifyBrowser ? "left-5" : "left-0.5"}`} />
              </div>
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-[#07101e] cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-2.5 text-sm text-slate-300">
                <Mail size={16} className="text-purple-400" />
                E-posta Bildirimi
              </div>
              <div
                onClick={() => setNotifyEmail(!notifyEmail)}
                className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${notifyEmail ? "bg-blue-600" : "bg-slate-700"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${notifyEmail ? "left-5" : "left-0.5"}`} />
              </div>
            </label>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-sm font-semibold transition-all"
          >
            İptal
          </button>
          <button
            onClick={onCreate}
            disabled={!valid}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              valid
                ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            Alarmı Kur
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyAlarms({ onOpen }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#07101e] px-6 text-center">
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600/10 text-blue-400 shadow-[0_0_35px_rgba(37,99,235,0.25)]">
        <Bell size={48} />
      </div>
      <h2 className="text-2xl font-bold text-white">Henüz alarm kurmadın.</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
        Varlık fiyatları istediğin seviyeye ulaştığında tarayıcı ve e-posta ile bildirim al.
      </p>
      <button
        onClick={onOpen}
        className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
      >
        <Plus size={16} />
        İlk Alarmını Kur
      </button>
    </div>
  );
}

function EmptyNotifications() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#07101e] px-6 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-slate-500">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="text-xl font-bold text-white">Bildirim yok</h2>
      <p className="mt-2 text-sm text-slate-400">Alarmlar tetiklendiğinde burada görünecek.</p>
    </div>
  );
}

export default Alarms;