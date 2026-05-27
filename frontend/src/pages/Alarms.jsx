import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bell, BellOff, Plus, Trash2, X, CheckCircle2, AlertTriangle,
  TrendingUp, TrendingDown, Clock, Mail, Smartphone, ChevronDown,
  Activity, Target,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useTheme, getThemeClasses } from "../context/ThemeContext";

const assetTypes = [
  { name: "Bitcoin", icon: "₿", color: "#f7931a", unit: "USD" },
  { name: "Dolar",   icon: "$", color: "#4ade80", unit: "TRY" },
  { name: "Euro",    icon: "€", color: "#60a5fa", unit: "TRY" },
  { name: "Sterlin", icon: "£", color: "#a78bfa", unit: "TRY" },
  { name: "Altın",   icon: "🟡", color: "#fbbf24", unit: "TRY/gr" },
  { name: "Gümüş",  icon: "⚪", color: "#94a3b8", unit: "TRY/gr" },
  { name: "Borsa",   icon: "📈", color: "#34d399", unit: "BIST" },
];
const mockPrices = { Bitcoin: 2850000, Dolar: 32.45, Euro: 35.12, Sterlin: 41.22, Altın: 1985.5, Gümüş: 24.8, Borsa: 10842 };

function Alarms({ isLoggedIn, setIsLoggedIn }) {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  const [alarms, setAlarms] = useState(() => { try { return JSON.parse(localStorage.getItem("tradein_alarms") || "[]"); } catch { return []; } });
  const [notifications, setNotifications] = useState(() => { try { return JSON.parse(localStorage.getItem("tradein_alarm_notifs") || "[]"); } catch { return []; } });
  const [prices, setPrices] = useState(mockPrices);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("alarms");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(assetTypes[0]);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState("above");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyBrowser, setNotifyBrowser] = useState(true);
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "default");
  const priceIntervalRef = useRef(null);
  const checkedAlarmsRef = useRef(new Set());

  useEffect(() => { localStorage.setItem("tradein_alarms", JSON.stringify(alarms)); }, [alarms]);
  useEffect(() => { localStorage.setItem("tradein_alarm_notifs", JSON.stringify(notifications)); }, [notifications]);

  useEffect(() => {
    priceIntervalRef.current = setInterval(() => {
      setPrices(prev => Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, v * (1 + (Math.random() - 0.5) * 0.002)])));
    }, 3000);
    return () => clearInterval(priceIntervalRef.current);
  }, []);

  const triggerAlarm = useCallback((alarm, currentPrice) => {
    const newNotif = {
      id: Date.now(), asset: alarm.asset, assetIcon: alarm.assetIcon, assetColor: alarm.assetColor,
      unit: alarm.unit, targetPrice: alarm.targetPrice, currentPrice, condition: alarm.condition,
      timestamp: new Date().toISOString(), read: false,
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);
    setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, active: false } : a));
    if (alarm.notifyBrowser && notifPermission === "granted") {
      new Notification("🔔 TradeIn Alarm!", { body: `${alarm.asset} ${alarm.condition === "above" ? "üstüne çıktı" : "altına düştü"}: ${formatPrice(currentPrice)} ${alarm.unit}`, icon: "/favicon.ico" });
    }
  }, [notifPermission]);

  useEffect(() => {
    alarms.filter(a => a.active).forEach(alarm => {
      if (checkedAlarmsRef.current.has(alarm.id)) return;
      const cp = prices[alarm.asset];
      if (!cp) return;
      const hit = alarm.condition === "above" ? cp >= alarm.targetPrice : cp <= alarm.targetPrice;
      if (hit) { checkedAlarmsRef.current.add(alarm.id); triggerAlarm(alarm, cp); }
    });
  }, [prices, alarms, triggerAlarm]);

  const requestNotifPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const handleCreateAlarm = () => {
    if (!targetPrice || isNaN(Number(targetPrice)) || Number(targetPrice) <= 0) return;
    setAlarms(prev => [{ id: Date.now(), asset: selectedAsset.name, assetIcon: selectedAsset.icon, assetColor: selectedAsset.color, unit: selectedAsset.unit, targetPrice: Number(targetPrice), condition, notifyEmail, notifyBrowser, active: true, createdAt: new Date().toISOString() }, ...prev]);
    setShowCreateModal(false); setTargetPrice(""); setCondition("above");
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  function formatPrice(val) { return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(val); }
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
      <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col items-center justify-center p-4 transition-colors duration-300`}>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600/10 text-blue-400 mb-6">
          <Bell size={48} />
        </div>
        <h2 className="text-2xl font-black mb-2">Alarmlarını Yönet</h2>
        <p className={`${t.textSecond} mb-8 text-center max-w-sm`}>Fiyat alarmları kurabilmek için giriş yapman gerekiyor.</p>
        <Link to="/login" className="bg-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors text-white">Giriş Yap</Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col relative transition-colors duration-300`}>
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isLoggedIn={isLoggedIn || hasLocalToken}
        handleLogout={() => { localStorage.removeItem("tradein_token"); setIsLoggedIn(false); }}
        user={user} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="flex flex-1 w-full">
        <Sidebar isOpen={isSidebarOpen} isLoggedIn={isLoggedIn || hasLocalToken} setIsLoggedIn={setIsLoggedIn} alarmNotifCount={unreadCount} />

        <main className="flex-1 min-w-0 px-6 py-6 transition-all duration-300">
          {/* Başlık */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${t.textPrimary} flex items-center gap-3`}>
                <Bell size={28} className="text-blue-400" /> Alarmlar
              </h1>
              <p className={`${t.textSecond} text-sm mt-1`}>Varlık fiyatlarına göre otomatik bildirim alın</p>
            </div>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg">
              <Plus size={18} /> Alarm Kur
            </button>
          </div>

          {/* Canlı Fiyat Bandı */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {assetTypes.map(asset => (
              <div key={asset.name} className={`rounded-xl border ${t.cardBorder} ${t.deepCardBg} px-3 py-2.5 flex flex-col gap-0.5 transition-colors duration-300`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{asset.icon}</span>
                  <span className={`text-xs font-semibold ${t.textSecond}`}>{asset.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: asset.color }}>{formatPrice(prices[asset.name])}</span>
                <span className={`text-[10px] ${t.textMuted}`}>{asset.unit}</span>
              </div>
            ))}
          </div>

          {/* Bildirim izni */}
          {notifPermission !== "granted" && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
              <div className="flex items-center gap-3 text-sm text-yellow-400">
                <AlertTriangle size={18} /> Tarayıcı bildirimleri kapalı.
              </div>
              <button onClick={requestNotifPermission} className="text-xs font-bold text-yellow-400 hover:text-yellow-300 border border-yellow-500/40 px-3 py-1.5 rounded-lg transition-colors">İzin Ver</button>
            </div>
          )}

          {/* Sekmeler */}
          <div className={`flex gap-1 mb-6 ${t.deepCardBg} border ${t.cardBorder} rounded-xl p-1 w-fit transition-colors duration-300`}>
            {[["alarms","Alarmlarım"], ["notifications","Bildirimler"]].map(([id, label]) => (
              <button key={id} onClick={() => { setActiveTab(id); if (id === "notifications") setNotifications(prev => prev.map(n => ({...n, read: true}))); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === id ? "bg-blue-600 text-white shadow" : `${t.textSecond} ${t.hoverText} ${t.hoverBg}`}`}>
                {label}
                {id === "alarms" && alarms.length > 0 && <span className={`ml-2 text-xs ${t.cardBg2} ${t.textSecond} px-1.5 py-0.5 rounded-full`}>{alarms.length}</span>}
                {id === "notifications" && unreadCount > 0 && <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">{unreadCount}</span>}
              </button>
            ))}
          </div>

          {activeTab === "alarms" && (
            alarms.length === 0 ? <EmptyAlarms t={t} onOpen={() => setShowCreateModal(true)} /> :
            <div className="space-y-3">
              {alarms.map(alarm => (
                <AlarmCard key={alarm.id} t={t} alarm={alarm} currentPrice={prices[alarm.asset]}
                  onDelete={() => setAlarms(prev => prev.filter(a => a.id !== alarm.id))}
                  onToggle={() => setAlarms(prev => prev.map(a => a.id === alarm.id ? {...a, active: !a.active} : a))}
                  formatPrice={formatPrice} relativeTime={relativeTime} />
              ))}
            </div>
          )}

          {activeTab === "notifications" && (
            notifications.length === 0 ? <EmptyNotifications t={t} /> :
            <div className="space-y-3">
              {notifications.length > 0 && (
                <div className="flex justify-end mb-3">
                  <button onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Tümünü okundu işaretle</button>
                </div>
              )}
              {notifications.map(notif => (
                <NotificationCard key={notif.id} t={t} notif={notif}
                  onDelete={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  formatPrice={formatPrice} relativeTime={relativeTime} />
              ))}
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateAlarmModal t={t} assetTypes={assetTypes} selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset}
          targetPrice={targetPrice} setTargetPrice={setTargetPrice} condition={condition} setCondition={setCondition}
          notifyEmail={notifyEmail} setNotifyEmail={setNotifyEmail} notifyBrowser={notifyBrowser} setNotifyBrowser={setNotifyBrowser}
          assetDropdownOpen={assetDropdownOpen} setAssetDropdownOpen={setAssetDropdownOpen}
          currentPrice={prices[selectedAsset.name]} formatPrice={formatPrice}
          onClose={() => setShowCreateModal(false)} onCreate={handleCreateAlarm} />
      )}
    </div>
  );
}

function AlarmCard({ t, alarm, currentPrice, onDelete, onToggle, formatPrice, relativeTime }) {
  const isAbove = alarm.condition === "above";
  return (
    <div className={`rounded-2xl border p-5 transition-all ${alarm.active ? `border-blue-500/30 ${t.cardBg}` : `${t.cardBorder} ${t.deepCardBg} opacity-60`}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-xl flex-shrink-0"
            style={{ backgroundColor: alarm.assetColor + "22", border: `1px solid ${alarm.assetColor}44` }}>
            {alarm.assetIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-base ${t.textPrimary}`}>{alarm.asset}</span>
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isAbove ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                {isAbove ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {isAbove ? "Üzerine çıkınca" : "Altına düşünce"}
              </span>
              {!alarm.active && <span className={`text-xs ${t.tagBg} ${t.textSecond} px-2 py-0.5 rounded-full`}>Tetiklendi</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={`text-sm ${t.textSecond}`}>Hedef: <span className={`${t.textPrimary} font-semibold`}>{formatPrice(alarm.targetPrice)} {alarm.unit}</span></span>
              {currentPrice && <span className={`text-sm ${t.textSecond}`}>Şimdi: <span style={{ color: alarm.assetColor }} className="font-semibold">{formatPrice(currentPrice)} {alarm.unit}</span></span>}
            </div>
            <div className="flex items-center gap-3 mt-2">
              {alarm.notifyBrowser && <span className={`flex items-center gap-1 text-[11px] ${t.textMuted}`}><Smartphone size={11} /> Tarayıcı</span>}
              {alarm.notifyEmail && <span className={`flex items-center gap-1 text-[11px] ${t.textMuted}`}><Mail size={11} /> E-posta</span>}
              <span className={`flex items-center gap-1 text-[11px] ${t.textMuted}`}><Clock size={11} />{relativeTime(alarm.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onToggle} className={`p-2 rounded-lg border transition-all ${alarm.active ? "border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" : `${t.cardBorder} ${t.deepCardBg} ${t.textSecond} hover:border-emerald-500/40 hover:text-emerald-400`}`}>
            {alarm.active ? <BellOff size={16} /> : <Bell size={16} />}
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationCard({ t, notif, onDelete, formatPrice, relativeTime }) {
  const isAbove = notif.condition === "above";
  return (
    <div className={`rounded-2xl border p-5 transition-all ${!notif.read ? `border-blue-500/40 ${t.cardBg}` : `${t.cardBorder} ${t.deepCardBg}`}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl text-lg flex-shrink-0"
            style={{ backgroundColor: notif.assetColor + "22", border: `1px solid ${notif.assetColor}44` }}>
            {notif.assetIcon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold ${t.textPrimary}`}>{notif.asset}</span>
              {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse" />}
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isAbove ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                {isAbove ? <TrendingUp size={11} /> : <TrendingDown size={11} />} Alarm Tetiklendi
              </span>
            </div>
            <p className={`text-sm ${t.textSecond} mt-0.5`}>
              Hedef <span className={`${t.textPrimary} font-semibold`}>{formatPrice(notif.targetPrice)}</span> seviyesi geçildi. Anlık: <span style={{ color: notif.assetColor }} className="font-semibold">{formatPrice(notif.currentPrice)}</span>
            </p>
            <span className={`flex items-center gap-1 text-[11px] ${t.textMuted} mt-1`}><Clock size={11} />{relativeTime(notif.timestamp)}</span>
          </div>
        </div>
        <button onClick={onDelete} className={`p-2 rounded-lg border ${t.cardBorder} ${t.textSecond} hover:text-red-400 hover:border-red-500/30 transition-all flex-shrink-0`}><X size={15} /></button>
      </div>
    </div>
  );
}

function CreateAlarmModal({ t, assetTypes, selectedAsset, setSelectedAsset, targetPrice, setTargetPrice, condition, setCondition, notifyEmail, setNotifyEmail, notifyBrowser, setNotifyBrowser, assetDropdownOpen, setAssetDropdownOpen, currentPrice, formatPrice, onClose, onCreate }) {
  const valid = targetPrice && !isNaN(Number(targetPrice)) && Number(targetPrice) > 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border border-blue-500/30 ${t.modalBg} shadow-2xl p-6 transition-colors duration-300`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-blue-400" />
            <h2 className={`text-lg font-bold ${t.textPrimary}`}>Yeni Alarm Kur</h2>
          </div>
          <button onClick={onClose} className={`p-1.5 ${t.textMuted} hover:${t.textPrimary} transition-colors`}><X size={18} /></button>
        </div>

        {/* Varlık */}
        <div className="mb-4">
          <label className={`block text-xs font-semibold ${t.textMuted} mb-2 uppercase tracking-wider`}>Varlık</label>
          <div className="relative">
            <button onClick={() => setAssetDropdownOpen(!assetDropdownOpen)}
              className={`w-full flex items-center justify-between gap-3 rounded-xl border ${t.inputBorder} ${t.inputBg} px-4 py-3 text-sm ${t.textPrimary} hover:border-blue-500/50 transition-colors`}>
              <div className="flex items-center gap-2">
                <span>{selectedAsset.icon}</span>
                <span className="font-semibold">{selectedAsset.name}</span>
                <span className={`${t.textMuted} text-xs`}>({selectedAsset.unit})</span>
              </div>
              <ChevronDown size={16} className={`${t.textMuted} transition-transform ${assetDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {assetDropdownOpen && (
              <div className={`absolute top-full mt-1 w-full rounded-xl border ${t.cardBorder} ${t.dropdownBg} overflow-hidden z-10 shadow-xl`}>
                {assetTypes.map(asset => (
                  <button key={asset.name} onClick={() => { setSelectedAsset(asset); setAssetDropdownOpen(false); }}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm ${t.hoverBg} transition-colors text-left`}>
                    <span>{asset.icon}</span>
                    <span className={`font-semibold ${t.textPrimary}`}>{asset.name}</span>
                    <span className={`${t.textMuted} text-xs ml-auto`}>{asset.unit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {currentPrice && <p className={`text-xs ${t.textMuted} mt-1.5 px-1`}>Anlık: <span style={{ color: selectedAsset.color }} className="font-semibold">{formatPrice(currentPrice)} {selectedAsset.unit}</span></p>}
        </div>

        {/* Koşul */}
        <div className="mb-4">
          <label className={`block text-xs font-semibold ${t.textMuted} mb-2 uppercase tracking-wider`}>Koşul</label>
          <div className="grid grid-cols-2 gap-2">
            {[["above","Üzerine Çıkınca","emerald"], ["below","Altına Düşünce","red"]].map(([val, label, color]) => (
              <button key={val} onClick={() => setCondition(val)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${condition === val ? `border-${color}-500/50 bg-${color}-500/15 text-${color}-400` : `${t.inputBorder} ${t.inputBg} ${t.textSecond} hover:border-gray-500`}`}>
                {val === "above" ? <TrendingUp size={15} /> : <TrendingDown size={15} />} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Hedef Fiyat */}
        <div className="mb-5">
          <label className={`block text-xs font-semibold ${t.textMuted} mb-2 uppercase tracking-wider`}>Hedef Fiyat ({selectedAsset.unit})</label>
          <div className={`flex items-center rounded-xl border ${t.inputBorder} ${t.inputBg} px-4 focus-within:border-blue-500 transition-colors`}>
            <Activity size={16} className={`${t.textMuted} mr-2 flex-shrink-0`} />
            <input type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="Örn: 35.50"
              className={`h-12 flex-1 bg-transparent text-sm ${t.textPrimary} outline-none ${t.placeholder}`} />
            <span className={`text-xs ${t.textMuted}`}>{selectedAsset.unit}</span>
          </div>
        </div>

        {/* Bildirim kanalları */}
        <div className="mb-6">
          <label className={`block text-xs font-semibold ${t.textMuted} mb-3 uppercase tracking-wider`}>Bildirim Kanalları</label>
          <div className="space-y-2">
            {[[notifyBrowser, setNotifyBrowser, Smartphone, "text-blue-400", "Tarayıcı Bildirimi"],
              [notifyEmail, setNotifyEmail, Mail, "text-purple-400", "E-posta Bildirimi"]].map(([val, setter, Icon, iconColor, label], i) => (
              <label key={i} className={`flex items-center justify-between p-3 rounded-xl border ${t.cardBorder} ${t.deepCardBg} cursor-pointer hover:border-gray-500 transition-colors`}>
                <div className={`flex items-center gap-2.5 text-sm ${t.textSecond}`}>
                  <Icon size={16} className={iconColor} /> {label}
                </div>
                <div onClick={() => setter(!val)} className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${val ? "bg-blue-600" : t.toggleOff}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${val ? "left-5" : "left-0.5"}`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl border ${t.cardBorder} ${t.textSecond} ${t.hoverText} ${t.hoverBg} text-sm font-semibold transition-all`}>İptal</button>
          <button onClick={onCreate} disabled={!valid}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${valid ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg" : `${t.cardBg2} ${t.textMuted} cursor-not-allowed`}`}>
            Alarmı Kur
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyAlarms({ t, onOpen }) {
  return (
    <div className={`flex min-h-[360px] flex-col items-center justify-center rounded-2xl border ${t.cardBorder} ${t.deepCardBg} px-6 text-center transition-colors duration-300`}>
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600/10 text-blue-400"><Bell size={48} /></div>
      <h2 className={`text-2xl font-bold ${t.textPrimary}`}>Henüz alarm kurmadın.</h2>
      <p className={`mt-3 max-w-md text-sm leading-6 ${t.textSecond}`}>Varlık fiyatları istediğin seviyeye ulaştığında bildirim al.</p>
      <button onClick={onOpen} className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all">
        <Plus size={16} /> İlk Alarmını Kur
      </button>
    </div>
  );
}

function EmptyNotifications({ t }) {
  return (
    <div className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border ${t.cardBorder} ${t.deepCardBg} px-6 text-center transition-colors duration-300`}>
      <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full ${t.cardBg2} ${t.textMuted}`}><CheckCircle2 size={40} /></div>
      <h2 className={`text-xl font-bold ${t.textPrimary}`}>Bildirim yok</h2>
      <p className={`mt-2 text-sm ${t.textSecond}`}>Alarmlar tetiklendiğinde burada görünecek.</p>
    </div>
  );
}

export default Alarms;
