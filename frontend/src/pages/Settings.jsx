import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useTheme, getThemeClasses } from '../context/ThemeContext';
import {
  Sun, Moon, Lock, Eye, EyeOff, Bell, BellOff,
  Globe, ChevronRight, Shield, LogIn, CheckCircle2,
  XCircle, Settings as SettingsIcon, Languages,
  Monitor, AtSign, User, AlertTriangle, Trash2, X
} from 'lucide-react';

/* ── Türkçe büyük harf — CSS uppercase İ→I yaptığı için inline kullan ── */
const trUpper = (str) => str.toLocaleUpperCase('tr-TR');

/* ── Bölüm başlığı ── */
const SectionTitle = ({ label, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={16} className="text-blue-400" />
    <span className="text-xs font-bold tracking-widest text-blue-400"
      style={{ letterSpacing: '0.1em' }}>
      {trUpper(label)}
    </span>
  </div>
);

/* ── Ayar satırı ── */
const SettingRow = ({ icon: Icon, title, subtitle, children, danger, t }) => (
  <div className={`flex items-center justify-between px-5 py-4 ${t.cardBg} border
    ${danger ? 'border-red-900/30' : t.cardBorder} rounded-xl hover:border-blue-500/40 transition-all`}>
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center
        ${danger ? 'bg-red-500/10 text-red-400' : `${t.deepCardBg} ${t.textSecond}`}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className={`text-sm font-semibold ${danger ? 'text-red-400' : t.textPrimary}`}>{title}</p>
        {subtitle && <p className={`text-xs ${t.textMuted} mt-0.5`}>{subtitle}</p>}
      </div>
    </div>
    <div className="flex items-center gap-3">{children}</div>
  </div>
);

/* ── Toggle ── */
const Toggle = ({ checked, onChange, disabled, t }) => (
  <button onClick={() => !disabled && onChange(!checked)} disabled={disabled}
    className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none
      ${checked ? 'bg-blue-600' : t.toggleOff}
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
      transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

/* ── Şifre input ── */
const PasswordInput = ({ label, value, onChange, placeholder, error, t }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className={`block text-xs ${t.textSecond} mb-1.5 font-medium`}>{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          data-form-type="other"
          data-lpignore="true"
          className={`w-full ${t.inputBg} border ${error ? 'border-red-500' : t.inputBorder}
            rounded-lg px-4 py-2.5 text-sm ${t.textPrimary} ${t.placeholder}
            focus:outline-none focus:border-blue-500 transition-all pr-10`}
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted}`}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
};

/* ═══════════════════ ANA COMPONENT ═══════════════════ */
const Settings = ({ isLoggedIn, setIsLoggedIn }) => {
  const { theme, setTheme } = useTheme();
  const t = getThemeClasses(theme);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery]     = useState('');

  /* Kullanıcı bilgileri — sadece backend'den gelir, localStorage kullanılmaz */
  const [currentUsername, setCurrentUsername] = useState(null); // null = yükleniyor
  const [userDisplayName, setUserDisplayName] = useState('');

  /* Bildirimler */
  const [notifPrice, setNotifPrice]   = useState(() => localStorage.getItem('notif_price') !== 'false');
  const [notifSocial, setNotifSocial] = useState(() => localStorage.getItem('notif_social') !== 'false');


  /* Kullanıcı adı değiştirme */
  const [newUsername, setNewUsername]       = useState('');
  const [usernameError, setUsernameError]   = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  /* Şifre değiştirme */
  const [pwForm, setPwForm]     = useState({ old: '', new1: '', new2: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwStatus, setPwStatus] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  /* Hesap silme popup */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Kullanıcı bilgilerini SADECE backend'den çek ── */
  useEffect(() => {
    const token = localStorage.getItem('tradein_token');
    if (!token || !isLoggedIn) { setCurrentUsername(''); return; }
    axios.get('http://127.0.0.1:8000/profilim', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        // Backend "@pinarkarabulut" formatında dönebilir, @ işaretini temizle
        const raw = res.data.username || '';
        const clean = raw.startsWith('@') ? raw.slice(1) : raw;
        setCurrentUsername(clean);
        setUserDisplayName(res.data.name || clean);
        // newUsername'i boş bırak — placeholder olarak gösterilecek
        setNewUsername('');
      })
      .catch(() => { setCurrentUsername(''); });
  }, [isLoggedIn]);

  useEffect(() => { localStorage.setItem('notif_price', notifPrice); }, [notifPrice]);
  useEffect(() => { localStorage.setItem('notif_social', notifSocial); }, [notifSocial]);
  /* ── Bildirim Ayarlarını Backend'e Gönder ── */
  const handleNotifToggle = async (type, newValue) => {
    // Arayüzü anında değiştir ki kullanıcı beklemesin
    if (type === 'price') { setNotifPrice(newValue); localStorage.setItem('notif_price', newValue); }
    if (type === 'social') { setNotifSocial(newValue); localStorage.setItem('notif_social', newValue); }

    try {
      const token = localStorage.getItem('tradein_token');
      await axios.put('http://127.0.0.1:8000/bildirim-ayarlari', 
        { ayar_tipi: type, deger: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Bildirim ayarı kaydedilemedi:", error);
    }
  };

  /* ── Kullanıcı adı kaydet ── */
  const handleUsernameSave = async () => {
    const val = newUsername.trim().toLowerCase();

    // Frontend doğrulama
    if (!val) { setUsernameError('Kullanıcı adı boş olamaz'); return; }
    if (val.length < 3) { setUsernameError('En az 3 karakter olmalı'); return; }
    if (val.length > 30) { setUsernameError('En fazla 30 karakter olabilir'); return; }
    if (!/^[a-z0-9_]+$/.test(val)) { setUsernameError('Sadece harf, rakam ve _ kullanılabilir'); return; }
    if (val === currentUsername) { setUsernameError('Bu zaten mevcut kullanıcı adın'); return; }

    setUsernameLoading(true); setUsernameStatus(null); setUsernameError('');
    try {
      const token = localStorage.getItem('tradein_token');
      const res = await axios.put(
        'http://127.0.0.1:8000/kullanici-adi-degistir',
        { new_username: val },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentUsername(res.data.username);
      setNewUsername('');
      setUsernameStatus('success');
    } catch (err) {
      if (err.response?.status === 409) setUsernameStatus('taken');
      else setUsernameStatus('error');
    } finally { setUsernameLoading(false); }
  };

  /* ── Şifre kaydet ── */
  const validatePw = () => {
    const errs = {};
    if (!pwForm.old) errs.old = 'Mevcut şifre gerekli';
    if (pwForm.new1.length < 6) errs.new1 = 'En az 6 karakter olmalı';
    if (pwForm.new1 !== pwForm.new2) errs.new2 = 'Şifreler eşleşmiyor';
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePwSubmit = async () => {
    if (!validatePw()) return;
    setPwLoading(true); setPwStatus(null);
    try {
      const token = localStorage.getItem('tradein_token');
      await axios.post(
        'http://127.0.0.1:8000/sifre-degistir',
        { old_password: pwForm.old, new_password: pwForm.new1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwStatus('success'); setPwForm({ old: '', new1: '', new2: '' });
    } catch { setPwStatus('error'); }
    finally { setPwLoading(false); }
  };

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex flex-col transition-colors duration-300`}>
      <Navbar
        toggleSidebar={() => setIsSidebarOpen(s => !s)}
        isLoggedIn={isLoggedIn}
        handleLogout={() => { localStorage.removeItem('tradein_token'); setIsLoggedIn(false); }}
        user={userDisplayName ? { name: userDisplayName } : null}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex flex-1 w-full">
        <Sidebar isOpen={isSidebarOpen} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

        <main className="flex-1 min-w-0 px-6 py-8 max-w-2xl mx-auto w-full">

          {/* Başlık */}
          <div className="mb-8 flex items-center gap-3">
            <SettingsIcon size={22} className="text-blue-400" />
            <div>
              <h1 className="text-2xl font-black tracking-tight">Ayarlar</h1>
              <p className={`text-sm ${t.textMuted}`}>Hesap ve uygulama tercihlerini yönet</p>
            </div>
          </div>

          <div className="space-y-8">

            {/* ══ GÖRÜNÜM ══ */}
            <section>
              <SectionTitle icon={Monitor} label="Görünüm" />
              <div className="space-y-3">

                <SettingRow t={t} icon={theme === 'dark' ? Moon : Sun}
                  title="Tema" subtitle={theme === 'dark' ? 'Koyu tema aktif' : 'Açık tema aktif'}>
                  <div className={`flex items-center gap-1 ${t.deepCardBg} border ${t.cardBorder} rounded-xl p-1`}>
                    <button onClick={() => setTheme('light')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                        ${theme === 'light' ? 'bg-blue-600 text-white shadow' : `${t.textSecond} ${t.hoverText}`}`}>
                      <Sun size={13} /> Açık
                    </button>
                    <button onClick={() => setTheme('dark')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                        ${theme === 'dark' ? 'bg-blue-600 text-white shadow' : `${t.textSecond} ${t.hoverText}`}`}>
                      <Moon size={13} /> Koyu
                    </button>
                  </div>
                </SettingRow>

              </div>
            </section>

            {/* ══ BİLDİRİMLER ══ */}
            <section>
              <SectionTitle icon={Bell} label="Bildirimler" />
              <div className="space-y-3">
                <SettingRow t={t} icon={Bell}
                  title="Fiyat Alarmları" subtitle="Alarm eşiği aşıldığında bildir">
                  <Toggle t={t} checked={notifPrice} onChange={(val) => handleNotifToggle('price', val)} disabled={!isLoggedIn} />
                </SettingRow>
                <SettingRow t={t} icon={BellOff}
                  title="Sosyal Etkileşimler" subtitle="Beğeni ve yorum bildirimleri">
                  <Toggle t={t} checked={notifSocial} onChange={(val) => handleNotifToggle('social', val)} disabled={!isLoggedIn} />
                </SettingRow>
                {!isLoggedIn && (
                  <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-400">
                    <LogIn size={14} />
                    Bildirimler için{' '}
                    <Link to="/login" className="font-bold underline underline-offset-2">giriş yapman</Link> gerekiyor.
                  </div>
                )}
              </div>
            </section>

            {/* ══ HESAP BİLGİLERİ (login) ══ */}
            {isLoggedIn && (
              <section>
                <SectionTitle icon={User} label="Hesap Bilgileri" />
                <div className={`${t.cardBg} border ${t.cardBorder} rounded-xl overflow-hidden`}>

                  {/* Mevcut kullanıcı adı başlık */}
                  <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.divider}`}>
                    <div className={`w-9 h-9 rounded-lg ${t.deepCardBg} ${t.textSecond} flex items-center justify-center`}>
                      <AtSign size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${t.textPrimary}`}>Kullanıcı Adı</p>
                      <p className={`text-xs ${t.textMuted} mt-0.5`}>
                        {/* currentUsername null iken yükleniyor, '' ise backend bağlanamadı demek */}
                        {currentUsername === null
                          ? <span className="animate-pulse">Yükleniyor...</span>
                          : currentUsername
                            ? <>Mevcut: <span className="text-blue-400 font-bold">@{currentUsername}</span></>
                            : <span className="text-yellow-400">
                                {/* Backend entegrasyonunu sağla — bu alan backenden gelecek */}
                                Kullanıcı adı yüklenemedi
                              </span>
                        }
                      </p>
                    </div>
                  </div>

                  {/* Yeni kullanıcı adı formu */}
                  <div className="px-5 py-4 space-y-3">
                    <div>
                      <label className={`block text-xs ${t.textSecond} mb-1.5 font-medium`}>
                        Yeni Kullanıcı Adı
                      </label>
                      <div className="relative flex items-center">
                        <span className={`absolute left-3 text-sm ${t.textMuted} font-bold select-none`}>@</span>
                        <input
                          type="text"
                          value={newUsername}
                          onChange={e => {
                            setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                            setUsernameError('');
                            setUsernameStatus(null);
                          }}
                          /* placeholder: currentUsername yüklendiyse onu göster, yoksa genel metin */
                          placeholder={currentUsername || 'Yeni kullanıcı ismini belirleyiniz'}
                          maxLength={30}
                          autoComplete="off"
                          autoCorrect="off"
                          data-form-type="other"
                          data-lpignore="true"
                          className={`w-full ${t.inputBg} border
                            ${usernameError ? 'border-red-500' : t.inputBorder}
                            rounded-lg pl-8 pr-4 py-2.5 text-sm ${t.textPrimary} ${t.placeholder}
                            focus:outline-none focus:border-blue-500 transition-all`}
                        />
                      </div>
                      <p className={`text-xs ${t.textMuted} mt-1`}>
                        Sadece harf (a-z), rakam ve _ kullanılabilir
                      </p>
                      {usernameError && <p className="text-xs text-red-400 mt-1">{usernameError}</p>}
                    </div>

                    {/* Durum mesajları */}
                    {usernameStatus === 'success' && (
                      <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                        <CheckCircle2 size={14} /> Kullanıcı adı başarıyla güncellendi!
                      </div>
                    )}
                    {usernameStatus === 'taken' && (
                      <div className="flex items-center gap-2 text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                        <XCircle size={14} /> Bu kullanıcı adı zaten kullanılıyor.
                      </div>
                    )}
                    {usernameStatus === 'error' && (
                      <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <XCircle size={14} /> Bir hata oluştu, tekrar dene.
                      </div>
                    )}

                    <button
                      onClick={handleUsernameSave}
                      disabled={usernameLoading || !newUsername.trim()}
                      className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2
                        ${usernameLoading || !newUsername.trim()
                          ? `${t.cardBg2} ${t.textMuted} cursor-not-allowed`
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'}`}>
                      {usernameLoading ? 'Kaydediliyor...' : <><User size={15} /> Kullanıcı Adını Güncelle</>}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ══ GÜVENLİK ══ */}
            <section>
              <SectionTitle icon={Shield} label="Güvenlik" />

              {isLoggedIn ? (
                <div className={`${t.cardBg} border ${t.cardBorder} rounded-xl overflow-hidden`}>
                  <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.divider}`}>
                    <div className={`w-9 h-9 rounded-lg ${t.deepCardBg} ${t.textSecond} flex items-center justify-center`}>
                      <Lock size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${t.textPrimary}`}>Şifre Değiştir</p>
                      <p className={`text-xs ${t.textMuted} mt-0.5`}>Güçlü bir şifre kullan</p>
                    </div>
                  </div>
                  <div className="px-5 py-5 space-y-4">
                    <PasswordInput t={t} label="Mevcut Şifre" value={pwForm.old}
                      onChange={v => { setPwForm(f=>({...f,old:v})); setPwErrors(e=>({...e,old:''})); }}
                      placeholder="••••••••" error={pwErrors.old} />
                    <PasswordInput t={t} label="Yeni Şifre" value={pwForm.new1}
                      onChange={v => { setPwForm(f=>({...f,new1:v})); setPwErrors(e=>({...e,new1:''})); }}
                      placeholder="En az 6 karakter" error={pwErrors.new1} />
                    <PasswordInput t={t} label="Yeni Şifre (Tekrar)" value={pwForm.new2}
                      onChange={v => { setPwForm(f=>({...f,new2:v})); setPwErrors(e=>({...e,new2:''})); }}
                      placeholder="Aynı şifreyi tekrar gir" error={pwErrors.new2} />

                    {pwStatus === 'success' && (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5">
                        <CheckCircle2 size={16} /> Şifre başarıyla güncellendi!
                      </div>
                    )}
                    {pwStatus === 'error' && (
                      <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                        <XCircle size={16} /> Mevcut şifre hatalı veya bir sorun oluştu.
                      </div>
                    )}
                    <button onClick={handlePwSubmit} disabled={pwLoading}
                      className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2
                        ${pwLoading ? `${t.cardBg2} ${t.textMuted}` : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'}`}>
                      {pwLoading ? 'Güncelleniyor...' : <><Lock size={15} /> Şifreyi Güncelle</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`${t.cardBg} border ${t.cardBorder} rounded-xl px-5 py-6 flex flex-col items-center text-center gap-3`}>
                  <div className={`w-12 h-12 rounded-full ${t.deepCardBg} flex items-center justify-center ${t.textMuted}`}>
                    <Lock size={22} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${t.textPrimary}`}>Güvenlik Ayarları Kilitli</p>
                    <p className={`text-xs ${t.textMuted} mt-1`}>Şifre değiştirmek için giriş yapman gerekiyor.</p>
                  </div>
                  <Link to="/login" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all mt-1">
                    <LogIn size={15} /> Giriş Yap
                  </Link>
                </div>
              )}
            </section>

            {/* ══ HESABI SİL (login) ══ */}
            {isLoggedIn && (
              <section>
                <SectionTitle icon={Shield} label="Tehlikeli Bölge" />
                <SettingRow t={t} icon={Shield} title="Hesabı Sil" subtitle="Bu işlem geri alınamaz" danger>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-xs text-red-400 border border-red-900/40 hover:bg-red-500/10 hover:border-red-500/60 px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5">
                    <Trash2 size={13} /> Hesabı Sil
                  </button>
                </SettingRow>
              </section>
            )}

            {/* ══ UYGULAMA ══ */}
            <section>
              <SectionTitle icon={Languages} label="Uygulama" />
              <div className="space-y-3">
                <div className={`flex items-center justify-between px-5 py-4 ${t.cardBg} border ${t.cardBorder} rounded-xl`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${t.deepCardBg} ${t.textSecond} flex items-center justify-center`}>
                      <SettingsIcon size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${t.textPrimary}`}>Versiyon</p>
                      <p className={`text-xs ${t.textMuted}`}>TradeIn Web</p>
                    </div>
                  </div>
                  <span className="text-xs text-blue-400 font-bold bg-blue-600/10 border border-blue-500/20 px-2.5 py-1 rounded-full">v1.0.0</span>
                </div>
                <div className={`flex items-center justify-between px-5 py-4 ${t.cardBg} border ${t.cardBorder} rounded-xl`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${t.deepCardBg} ${t.textSecond} flex items-center justify-center`}>
                      <Globe size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${t.textPrimary}`}>Gizlilik Politikası</p>
                      <p className={`text-xs ${t.textMuted}`}>Verilerini nasıl kullanıyoruz</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className={t.textMuted} />
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>

      {/* ══ HESABI SİL POPUP ══ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border border-red-500/30 ${t.modalBg} shadow-2xl overflow-hidden`}>

            {/* Başlık */}
            <div className={`flex items-center justify-between px-6 py-4 border-b border-red-900/30`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-400">Hesabı Kalıcı Olarak Sil</p>
                  <p className={`text-xs ${t.textMuted} mt-0.5`}>Bu işlem geri alınamaz</p>
                </div>
              </div>
              <button onClick={() => setShowDeleteModal(false)}
                className={`p-1.5 ${t.textMuted} hover:text-red-400 transition-colors`}>
                <X size={18} />
              </button>
            </div>

            {/* İçerik */}
            <div className="px-6 py-5 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 space-y-1">
                <p className="text-sm text-red-400 font-semibold">Silme işlemi sonucunda:</p>
                <ul className={`text-xs ${t.textSecond} space-y-1 mt-2 list-disc list-inside`}>
                  <li>Tüm gönderilerin ve yorumların silinecek</li>
                  <li>Portföy ve alarm verilerini kaybedeceksin</li>
                  <li>Takipçi ve takip listelerin temizlenecek</li>
                  <li>Bu hesaba bir daha erişemeyeceksin</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`flex-1 py-2.5 rounded-xl border ${t.cardBorder} ${t.textSecond} ${t.hoverBg} text-sm font-semibold transition-all`}>
                  Vazgeç
                </button>
                <button
                  disabled={deleteLoading}
                  onClick={async () => {
                    setDeleteLoading(true);
                    try {
                      const token = localStorage.getItem('tradein_token');
                      await fetch('http://127.0.0.1:8000/hesabimi-sil', {
                        method: 'DELETE',
                        headers: { Authorization: 'Bearer ' + token }
                      });
                      localStorage.removeItem('tradein_token');
                      setIsLoggedIn(false);
                      window.location.href = '/';
                    } catch {
                      setDeleteLoading(false);
                    }
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                    ${!deleteLoading
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
                  {deleteLoading ? 'Siliniyor...' : <><Trash2 size={15} /> Hesabı Kalıcı Sil</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
