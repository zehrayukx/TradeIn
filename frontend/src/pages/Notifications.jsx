import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Heart, MessageCircle, UserPlus, Check,
  CheckCheck, Trash2, RefreshCw, LogIn
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useTheme, getThemeClasses } from '../context/ThemeContext';

/* ─────────────────────────────────────────
   MOCK VERİ — backend bağlanınca silinecek
   Endpoint notu:
   GET /bildirimler  → aşağıdaki formatta dizi döndürsün
───────────────────────────────────────── */
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'follow',          // 'follow' | 'like' | 'comment'
    actor_name: 'Ahmet Yılmaz',
    actor_username: 'ahmetyilmaz',
    actor_avatar: 'https://ui-avatars.com/api/?name=AY&background=3b82f6&color=fff',
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),   // 10 dk önce
    read: false,
    post_id: null,
    post_preview: null,
  },
  {
    id: 2,
    type: 'like',
    actor_name: 'Zehra Yüksel',
    actor_username: 'zehrayukx',
    actor_avatar: 'https://ui-avatars.com/api/?name=ZY&background=a855f7&color=fff',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 sa önce
    read: false,
    post_id: 42,
    post_preview: 'Borsa ve Kripto yatırımı yapıyorum.',
  },
  {
    id: 3,
    type: 'comment',
    actor_name: 'Mehmet Kaya',
    actor_username: 'mehmetkaya',
    actor_avatar: 'https://ui-avatars.com/api/?name=MK&background=10b981&color=fff',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 sa önce
    read: true,
    post_id: 42,
    post_preview: 'Borsa ve Kripto yatırımı yapıyorum.',
    comment_preview: 'Harika bir analiz! BTC için hedef fiyat ne düşünüyorsun?',
  },
  {
    id: 4,
    type: 'like',
    actor_name: 'Selin Arslan',
    actor_username: 'selinarslan',
    actor_avatar: 'https://ui-avatars.com/api/?name=SA&background=f59e0b&color=fff',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(), // 1 gün önce
    read: true,
    post_id: 38,
    post_preview: 'Altın fiyatları bu hafta yükselebilir.',
  },
  {
    id: 5,
    type: 'follow',
    actor_name: 'Can Demir',
    actor_username: 'candemir',
    actor_avatar: 'https://ui-avatars.com/api/?name=CD&background=ef4444&color=fff',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 gün önce
    read: true,
    post_id: null,
    post_preview: null,
  },
  {
    id: 6,
    type: 'comment',
    actor_name: 'Ayşe Çelik',
    actor_username: 'aysecelik',
    actor_avatar: 'https://ui-avatars.com/api/?name=AC&background=6366f1&color=fff',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 gün önce
    read: true,
    post_id: 35,
    post_preview: 'Dolar/TL bu hafta 33 olur mu?',
    comment_preview: 'Bence olmaz, TCMB faiz artırabilir.',
  },
];

/* ─── Zaman formatı ─── */
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Az önce';
  if (mins  < 60) return `${mins} dakika önce`;
  if (hours < 24) return `${hours} saat önce`;
  return `${days} gün önce`;
}

/* ─── Bildirim ikonları ─── */
const TYPE_META = {
  follow:  { Icon: UserPlus,       color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   label: 'seni takip etti' },
  like:    { Icon: Heart,          color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    label: 'gönderini beğendi' },
  comment: { Icon: MessageCircle,  color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',label: 'gönderine yorum yaptı' },
};

/* ─── Tek bildirim kartı ─── */
const NotifCard = ({ notif, t, onRead, onDelete }) => {
  const meta = TYPE_META[notif.type];
  const Icon = meta.Icon;

  return (
    <div
      className={`relative flex gap-4 px-5 py-4 rounded-2xl border transition-all duration-200
        ${!notif.read
          ? `${t.cardBg} border-blue-500/30 shadow-sm shadow-blue-500/5`
          : `${t.cardBg} ${t.cardBorder}`
        }`}
    >
      {/* Okunmadı noktası */}
      {!notif.read && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      )}

      {/* Avatar + tip ikonu */}
      <div className="relative shrink-0">
        <img
          src={notif.actor_avatar}
          alt={notif.actor_name}
          className="w-11 h-11 rounded-full object-cover"
        />
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 ${t.cardBg} flex items-center justify-center ${meta.bg}`}>
          <Icon size={10} className={meta.color} />
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${t.textPrimary}`}>
          <Link
            to={`/profile/${notif.actor_username}`}
            className="font-bold hover:text-blue-400 transition-colors"
          >
            {notif.actor_name}
          </Link>
          {' '}
          <span className={t.textSecond}>{meta.label}</span>
        </p>

        {/* Yorum önizleme */}
        {notif.type === 'comment' && notif.comment_preview && (
          <p className={`text-xs ${t.textMuted} mt-1 line-clamp-1 italic`}>
            "{notif.comment_preview}"
          </p>
        )}

        {/* Gönderi önizleme (like veya comment) */}
        {notif.post_preview && (
          <Link
            to={notif.post_id ? `/post/${notif.post_id}` : '#'}
            className={`inline-block text-xs mt-1.5 px-2.5 py-1 rounded-lg ${t.deepCardBg} ${t.textSecond} border ${t.deepCardBorder} hover:border-blue-500/40 transition-colors line-clamp-1 max-w-xs`}
          >
            {notif.post_preview}
          </Link>
        )}

        <span className={`text-xs ${t.textMuted} mt-1.5 block`}>{timeAgo(notif.created_at)}</span>
      </div>

      {/* Aksiyonlar */}
      <div className="flex flex-col gap-1.5 shrink-0 items-end justify-start">
        {!notif.read && (
          <button
            onClick={() => onRead(notif.id)}
            title="Okundu işaretle"
            className={`p-1.5 rounded-lg ${t.deepCardBg} ${t.textMuted} hover:text-blue-400 hover:bg-blue-500/10 transition-all`}
          >
            <Check size={13} />
          </button>
        )}
        <button
          onClick={() => onDelete(notif.id)}
          title="Sil"
          className={`p-1.5 rounded-lg ${t.deepCardBg} ${t.textMuted} hover:text-red-400 hover:bg-red-500/10 transition-all`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   ANA SAYFA
═══════════════════════════════════════════ */
export default function Notifications({ isLoggedIn, setIsLoggedIn }) {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);

  const [isSidebarOpen, setIsSidebarOpen]     = useState(true);
  const [searchQuery, setSearchQuery]         = useState('');
  const [notifications, setNotifications]     = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [activeFilter, setActiveFilter]       = useState('all'); // 'all'|'unread'|'follow'|'like'|'comment'

  /* ── Bildirimleri yükle ── */
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tradein_token');
      /*
       * Backend'ci için not:
       * GET /bildirimler  — Authorization: Bearer <token>
       * Response: [{ id, type, actor_name, actor_username, actor_avatar,
       *              created_at, read, post_id, post_preview, comment_preview }]
       *
       * type alanı: 'follow' | 'like' | 'comment'
       * Beğeni ve yorumlar son 7 gün ile sınırlandırılsın (backend filtresi).
       */
      const res = await fetch('http://127.0.0.1:8000/bildirimler', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotifications(data);
    } catch {
      // Backend henüz hazır değil — mock veri kullan
      setNotifications(MOCK_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchNotifications();
    else setLoading(false);
  }, [isLoggedIn, fetchNotifications]);

  /* ── Okundu işaretle ── */
  const handleRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      const token = localStorage.getItem('tradein_token');
      /* Backend: PUT /bildirimler/{id}/oku */
      await fetch(`http://127.0.0.1:8000/bildirimler/${id}/oku`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* optimistic update yeterli */ }
  };

  /* ── Tümünü okundu işaretle ── */
  const handleReadAll = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const token = localStorage.getItem('tradein_token');
      /* Backend: PUT /bildirimler/tumunu-oku */
      await fetch('http://127.0.0.1:8000/bildirimler/tumunu-oku', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* optimistic update yeterli */ }
  };

  /* ── Sil ── */
  const handleDelete = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      const token = localStorage.getItem('tradein_token');
      /* Backend: DELETE /bildirimler/{id} */
      await fetch(`http://127.0.0.1:8000/bildirimler/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* optimistic update yeterli */ }
  };

  /* ── Filtrele ── */
  const filtered = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'follow') return n.type === 'follow';
    if (activeFilter === 'like')   return n.type === 'like';
    if (activeFilter === 'comment')return n.type === 'comment';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const FILTERS = [
    { key: 'all',     label: 'Tümü' },
    { key: 'unread',  label: 'Okunmamış' },
    { key: 'follow',  label: 'Takip' },
    { key: 'like',    label: 'Beğeni' },
    { key: 'comment', label: 'Yorum' },
  ];

  /* ── Login değil ── */
  if (!isLoggedIn && !localStorage.getItem('tradein_token')) {
    return (
      <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col items-center justify-center gap-4 transition-colors duration-300`}>
        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
          <Bell size={32} />
        </div>
        <p className={`text-sm ${t.textSecond}`}>Bildirimleri görmek için giriş yapman gerekiyor.</p>
        <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors">
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col transition-colors duration-300`}>
      <Navbar
        toggleSidebar={() => setIsSidebarOpen(s => !s)}
        isLoggedIn={isLoggedIn || !!localStorage.getItem('tradein_token')}
        handleLogout={() => { localStorage.removeItem('tradein_token'); setIsLoggedIn(false); }}
        user={null}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        notifCount={unreadCount}
      />

      <div className="flex flex-1 w-full">
        <Sidebar
          isOpen={isSidebarOpen}
          isLoggedIn={isLoggedIn || !!localStorage.getItem('tradein_token')}
          setIsLoggedIn={setIsLoggedIn}
          notifBadge={unreadCount}
        />

        <main className="flex-1 min-w-0 px-4 py-8 max-w-2xl mx-auto w-full">

          {/* ── Başlık ── */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Bell size={20} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">Bildirimler</h1>
                <p className={`text-xs ${t.textMuted}`}>
                  {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleReadAll}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${t.cardBorder} ${t.textSecond} ${t.hoverBg} transition-all`}
                >
                  <CheckCheck size={13} /> Tümünü Okundu İşaretle
                </button>
              )}
              <button
                onClick={fetchNotifications}
                className={`p-2 rounded-lg border ${t.cardBorder} ${t.textMuted} ${t.hoverBg} transition-all`}
                title="Yenile"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* ── Filtre sekmeleri ── */}
          <div className={`flex gap-1 mb-5 ${t.cardBg2} border ${t.cardBorder} rounded-xl p-1 w-fit`}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                  activeFilter === f.key
                    ? 'bg-blue-600 text-white shadow'
                    : `${t.textSecond} ${t.hoverText} ${t.hoverBg}`
                }`}
              >
                {f.label}
                {f.key === 'unread' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── İçerik ── */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-20 rounded-2xl ${t.cardBg} border ${t.cardBorder} animate-pulse`} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed ${t.cardBorder} ${t.deepCardBg}`}>
              <div className={`w-14 h-14 rounded-full ${t.cardBg} flex items-center justify-center ${t.textMuted} mb-3`}>
                <Bell size={26} />
              </div>
              <p className={`text-sm font-semibold ${t.textPrimary}`}>
                {activeFilter === 'all' ? 'Henüz bildirim yok' : 'Bu filtrede bildirim yok'}
              </p>
              <p className={`text-xs ${t.textMuted} mt-1`}>
                Beğeni, yorum ve takip bildirimleri burada görünecek
              </p>
            </div>
          ) : (
            <>
              {/* ── Tip grupları ── */}
              {activeFilter === 'all' && renderGroups(filtered, t, handleRead, handleDelete)}

              {/* ── Düz liste (filtreli) ── */}
              {activeFilter !== 'all' && (
                <div className="space-y-3">
                  {filtered.map(n => (
                    <NotifCard key={n.id} notif={n} t={t} onRead={handleRead} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Beğeni/yorum notu ── */}
          {!loading && (
            <p className={`text-center text-xs ${t.textMuted} mt-8`}>
              Beğeni ve yorum bildirimleri son 7 gün için gösterilmektedir.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

/* ─── Tip bazlı gruplama ─── */
function renderGroups(notifications, t, onRead, onDelete) {
  const groups = [
    { key: 'follow',  label: 'Takip', icon: UserPlus,      color: 'text-blue-400' },
    { key: 'like',    label: 'Beğeniler (Son 7 Gün)', icon: Heart, color: 'text-red-400' },
    { key: 'comment', label: 'Yorumlar (Son 7 Gün)', icon: MessageCircle, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {groups.map(group => {
        const items = notifications.filter(n => n.type === group.key);
        if (items.length === 0) return null;
        const Icon = group.icon;
        return (
          <div key={group.key}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={14} className={group.color} />
              <span className={`text-xs font-bold tracking-wider ${group.color}`}
                style={{ textTransform: 'uppercase' }}>
                {group.label.toLocaleUpperCase('tr-TR')}
              </span>
              <span className={`text-xs ${t.textMuted} font-normal`}>({items.length})</span>
            </div>
            <div className="space-y-3">
              {items.map(n => (
                <NotifCard key={n.id} notif={n} t={t} onRead={onRead} onDelete={onDelete} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
