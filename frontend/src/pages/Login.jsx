import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import axios from "axios";

/*
 * step değerleri:
 * 'login'  → normal giriş
 * 'email'  → şifre unuttum: e-posta gir
 * 'code'   → onay kodunu gir
 * 'reset'  → yeni şifre belirle
 *
 * NOT — Backend Bağlantı Notu:
 * Şu an tüm şifre sıfırlama adımlarında API isteği atılıyor
 * ama backend hazır olmasa bile bir sonraki adıma geçiliyor.
 * Backend hazır olduğunda catch bloklarındaki yorumları kaldır,
 * hata mesajlarını aktif et.
 */

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  /* Normal giriş */
  const [showPassword,    setShowPassword]    = useState(false);
  const [formData,        setFormData]        = useState({ identifier: "", password: "" });
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState(null);

  /* Şifre sıfırlama */
  const [step,              setStep]              = useState("login");
  const [resetEmail,        setResetEmail]        = useState("");
  const [resetCode,         setResetCode]         = useState("");
  const [newPassword,       setNewPassword]       = useState("");
  const [newPasswordConfirm,setNewPasswordConfirm]= useState("");
  const [showNew,           setShowNew]           = useState(false);
  const [showNewConfirm,    setShowNewConfirm]    = useState(false);
  const [resetLoading,      setResetLoading]      = useState(false);
  const [resetError,        setResetError]        = useState(null);
  const [resetSuccess,      setResetSuccess]      = useState(false);

  /* ── Normal giriş ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      params.append("username", formData.identifier);
      params.append("password", formData.password);
      const res = await axios.post("http://127.0.0.1:8000/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      localStorage.setItem("tradein_token", res.data.access_token);
      localStorage.setItem("tradein_username", res.data.username);
      setIsLoggedIn(true);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Giriş yapılamadı. Bilgileri kontrol et.");
    } finally { setIsLoading(false); }
  };

  /* ── ADIM 1: E-posta gönder ── */
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) { setResetError("E-posta adresi gerekli"); return; }
    setResetLoading(true); setResetError(null);
    try {
      /* Backend'ci için: POST /sifre-sifirla/email-gonder  Body: { email } */
      await axios.post("http://127.0.0.1:8000/sifre-sifirla/email-gonder", { email: resetEmail });
    } catch {
      /* Backend henüz bağlı değil — tasarım testi için devam ediliyor.
         Backend hazır olunca bu catch bloğunu şu şekilde değiştir:
         catch (err) { setResetError(err.response?.data?.detail || "Hata"); return; } */
    } finally {
      setResetLoading(false);
      setStep("code"); // backend hazır olsa da olmasa da ilerle
    }
  };

  /* ── ADIM 2: Kodu doğrula ── */
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (resetCode.trim().length < 4) { setResetError("Geçerli bir kod gir"); return; }
    setResetLoading(true); setResetError(null);
    try {
      /* Backend'ci için: POST /sifre-sifirla/kodu-dogrula  Body: { email, code } */
      await axios.post("http://127.0.0.1:8000/sifre-sifirla/kodu-dogrula", {
        email: resetEmail, code: resetCode,
      });
    } catch {
      /* Backend henüz bağlı değil — tasarım testi için devam ediliyor.
         Backend hazır olunca:
         catch (err) { setResetError(err.response?.data?.detail || "Kod hatalı"); return; } */
    } finally {
      setResetLoading(false);
      setStep("reset");
    }
  };

  /* ── ADIM 3: Yeni şifre ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6)            { setResetError("Şifre en az 6 karakter olmalı"); return; }
    if (newPassword !== newPasswordConfirm) { setResetError("Şifreler eşleşmiyor"); return; }
    setResetLoading(true); setResetError(null);
    try {
      /* Backend'ci için: POST /sifre-sifirla/yeni-sifre  Body: { email, code, new_password } */
      await axios.post("http://127.0.0.1:8000/sifre-sifirla/yeni-sifre", {
        email: resetEmail, code: resetCode, new_password: newPassword,
      });
    } catch {
      /* Backend henüz bağlı değil — tasarım testi için devam ediliyor.
         Backend hazır olunca:
         catch (err) { setResetError(err.response?.data?.detail || "Hata"); return; } */
    } finally {
      setResetLoading(false);
      setResetSuccess(true);
      setTimeout(() => {
        setStep("login");
        setResetEmail(""); setResetCode("");
        setNewPassword(""); setNewPasswordConfirm("");
        setResetSuccess(false); setResetError(null);
      }, 2000);
    }
  };

  /* ── Geri dön ── */
  const goBack = () => {
    setResetError(null);
    if      (step === "email") setStep("login");
    else if (step === "code")  setStep("email");
    else if (step === "reset") setStep("code");
  };

  const stepIndex = { email: 0, code: 1, reset: 2 };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white flex flex-col">
      <header className="p-6 flex justify-between items-center max-w-[1440px] w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-lg shadow-blue-500/30">TI</div>
          <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">TradeIn</span>
        </div>
        <div className="text-sm text-slate-400">
          Hesabın yok mu?
          <Link to="/register" className="text-blue-500 font-bold hover:underline ml-1">Üye Ol</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center">

          {/* ── SOL PANEL ── */}
          {step === "login" ? (
            <div className="hidden md:block space-y-8">
              <h1 className="text-4xl font-black leading-tight">
                Tek platform.<br /><span className="text-blue-500">Tüm piyasalar.</span>
              </h1>
              <p className="text-slate-400 leading-relaxed">
                Piyasaları takip et, analizlerini paylaş, topluluğa katıl ve yatırım fırsatlarını kaçırma.
              </p>
              <div className="space-y-4">
                <FeatureItem icon="👥" title="50K+" desc="Aktif Yatırımcı" />
                <FeatureItem icon="📈" title="7/24" desc="Piyasa Takibi" />
                <FeatureItem icon="🛡️" title="Güvenli" desc="Verilerin Koruma Altında" />
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                {step === "email" && <Mail     size={36} className="text-blue-400" />}
                {step === "code"  && <KeyRound size={36} className="text-blue-400" />}
                {step === "reset" && <ShieldCheck size={36} className="text-blue-400" />}
              </div>
              <div className="text-center">
                {step === "email" && (
                  <>
                    <h2 className="text-2xl font-black mb-2">Şifreni mi unuttun?</h2>
                    <p className="text-slate-400 text-sm max-w-xs">E-posta adresini gir, sana bir doğrulama kodu gönderelim.</p>
                  </>
                )}
                {step === "code" && (
                  <>
                    <h2 className="text-2xl font-black mb-2">Kodunu kontrol et</h2>
                    <p className="text-slate-400 text-sm max-w-xs">
                      <span className="text-blue-400 font-bold">{resetEmail}</span> adresine gönderilen kodu gir.
                    </p>
                  </>
                )}
                {step === "reset" && (
                  <>
                    <h2 className="text-2xl font-black mb-2">Yeni şifreni belirle</h2>
                    <p className="text-slate-400 text-sm max-w-xs">Güçlü bir şifre seç ve hesabını koru.</p>
                  </>
                )}
              </div>
              {/* Adım göstergesi */}
              <div className="flex items-center gap-3">
                {["email","code","reset"].map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                      ${step === s
                        ? "bg-blue-600 text-white"
                        : stepIndex[step] > i
                          ? "bg-blue-600/30 text-blue-400"
                          : "bg-white/5 text-slate-500"}`}>
                      {i + 1}
                    </div>
                    {i < 2 && <div className={`w-8 h-px ${stepIndex[step] > i ? "bg-blue-600/50" : "bg-white/10"}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* ── SAĞ KART ── */}
          <div className="bg-[#161b22] border border-white/5 p-10 rounded-[32px] shadow-2xl">

            {/* LOGIN */}
            {step === "login" && (
              <>
                <h2 className="text-2xl font-black mb-2">Giriş Yap</h2>
                <p className="text-slate-400 text-sm mb-6">Hesabına giriş yaparak devam et</p>
                {error && <ErrorBox message={error} />}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <InputGroup label="E-posta veya Kullanıcı Adı" icon={<Mail size={18}/>}
                    placeholder="ornek@email.com veya @kullaniciadi"
                    value={formData.identifier}
                    onChange={e => setFormData({...formData, identifier: e.target.value})} required />
                  <div className="relative">
                    <InputGroup label="Şifre" icon={<Lock size={18}/>}
                      type={showPassword ? "text" : "password"} placeholder="Şifrenizi girin"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-[42px] text-slate-500 hover:text-white">
                      {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                      <input type="checkbox" className="rounded bg-slate-800 border-white/5" /> Beni hatırla
                    </label>
                    <button type="button" onClick={() => { setStep("email"); setResetError(null); }}
                      className="text-blue-500 font-bold hover:underline">
                      Şifremi unuttum?
                    </button>
                  </div>
                  <button disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all">
                    {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                  </button>
                </form>
                <div className="relative my-8 text-center">
                  <span className="bg-[#161b22] px-4 text-slate-600 text-[10px] font-black uppercase tracking-widest relative z-10">veya</span>
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5" />
                </div>
                <div className="grid gap-3">
                  <SocialButton icon="https://www.google.com/favicon.ico" text="Google ile Devam Et" />
                  <SocialButton icon="https://www.apple.com/favicon.ico"  text="Apple ile Devam Et" />
                </div>
              </>
            )}

            {/* ADIM 1 — E-POSTA */}
            {step === "email" && (
              <>
                <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                  <ArrowLeft size={16}/> Geri dön
                </button>
                <h2 className="text-2xl font-black mb-2">Şifremi Unuttum</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Hesabına kayıtlı e-posta adresini gir, sana doğrulama kodu gönderelim.
                </p>
                {resetError && <ErrorBox message={resetError} />}
                <form onSubmit={handleSendEmail} className="space-y-5">
                  <InputGroup label="E-posta Adresi" icon={<Mail size={18}/>} type="email"
                    placeholder="ornek@email.com" value={resetEmail} autoComplete="email" required
                    onChange={e => { setResetEmail(e.target.value); setResetError(null); }} />
                  <button disabled={resetLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all">
                    {resetLoading ? "Gönderiliyor..." : "Doğrulama Kodu Gönder"}
                  </button>
                </form>
              </>
            )}

            {/* ADIM 2 — KOD */}
            {step === "code" && (
              <>
                <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                  <ArrowLeft size={16}/> Geri dön
                </button>
                <h2 className="text-2xl font-black mb-2">Doğrulama Kodu</h2>
                <p className="text-slate-400 text-sm mb-6">
                  <span className="text-blue-400 font-bold">{resetEmail}</span> adresine gönderilen kodu gir.
                </p>
                {resetError && <ErrorBox message={resetError} />}
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 ml-1">Onay Kodu</label>
                    <input
                      type="text" inputMode="numeric" maxLength={8}
                      placeholder="Kodu buraya gir"
                      value={resetCode}
                      onChange={e => { setResetCode(e.target.value.replace(/\D/g,"")); setResetError(null); }}
                      autoComplete="one-time-code"
                      className="w-full bg-[#0a0f1d] border border-white/5 rounded-xl py-4 px-5 text-center text-2xl font-black tracking-[0.4em] focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700 placeholder:tracking-normal placeholder:text-sm placeholder:font-normal"
                    />
                  </div>
                  <button disabled={resetLoading || resetCode.length < 4}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all">
                    {resetLoading ? "Doğrulanıyor..." : "Onayla"}
                  </button>
                </form>
                <button type="button" onClick={() => { setResetCode(""); setStep("email"); }}
                  className="w-full mt-4 text-xs text-slate-500 hover:text-blue-400 transition-colors text-center">
                  Kodu almadım, tekrar gönder
                </button>
              </>
            )}

            {/* ADIM 3 — YENİ ŞİFRE */}
            {step === "reset" && (
              <>
                <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                  <ArrowLeft size={16}/> Geri dön
                </button>
                <h2 className="text-2xl font-black mb-2">Yeni Şifre Belirle</h2>
                <p className="text-slate-400 text-sm mb-6">En az 6 karakterli güçlü bir şifre seç.</p>
                {resetError && <ErrorBox message={resetError} />}
                {resetSuccess && (
                  <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-bold flex items-center gap-2">
                    <ShieldCheck size={18}/> Şifren güncellendi! Giriş ekranına yönlendiriliyorsun...
                  </div>
                )}
                {!resetSuccess && (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    {/* Yeni şifre */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 ml-1">Yeni Şifre</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><Lock size={18}/></div>
                        <input type={showNew ? "text" : "password"} placeholder="En az 6 karakter"
                          value={newPassword} autoComplete="new-password" required
                          onChange={e => { setNewPassword(e.target.value); setResetError(null); }}
                          className="w-full bg-[#0a0f1d] border border-white/5 rounded-xl py-3.5 pl-12 pr-12 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                        <button type="button" onClick={() => setShowNew(!showNew)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                          {showNew ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                      </div>
                      {/* Güç göstergesi */}
                      {newPassword && (
                        <div className="flex gap-1 mt-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                              newPassword.length >= i*3
                                ? i<=1?"bg-red-500":i<=2?"bg-yellow-500":i<=3?"bg-blue-500":"bg-emerald-500"
                                : "bg-white/10"}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Tekrar */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 ml-1">Yeni Şifre Tekrar</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><Lock size={18}/></div>
                        <input type={showNewConfirm ? "text" : "password"} placeholder="Şifreni tekrar gir"
                          value={newPasswordConfirm} autoComplete="new-password" required
                          onChange={e => { setNewPasswordConfirm(e.target.value); setResetError(null); }}
                          className={`w-full bg-[#0a0f1d] border rounded-xl py-3.5 pl-12 pr-12 text-sm focus:outline-none transition-all ${
                            newPasswordConfirm && newPassword !== newPasswordConfirm ? "border-red-500/50 focus:border-red-500"
                            : newPasswordConfirm && newPassword === newPasswordConfirm ? "border-emerald-500/50 focus:border-emerald-500"
                            : "border-white/5 focus:border-blue-500"}`} />
                        <button type="button" onClick={() => setShowNewConfirm(!showNewConfirm)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                          {showNewConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                      </div>
                      {newPasswordConfirm && newPassword !== newPasswordConfirm && (
                        <p className="text-xs text-red-400 ml-1">Şifreler eşleşmiyor</p>
                      )}
                      {newPasswordConfirm && newPassword === newPasswordConfirm && (
                        <p className="text-xs text-emerald-400 ml-1">Şifreler eşleşiyor ✓</p>
                      )}
                    </div>
                    <button disabled={resetLoading || newPassword.length < 6 || newPassword !== newPasswordConfirm}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all">
                      {resetLoading ? "Kaydediliyor..." : "Şifremi Güncelle"}
                    </button>
                  </form>
                )}
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

const ErrorBox = ({ message }) => (
  <div className="mb-5 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm font-bold">{message}</div>
);

const FeatureItem = ({ icon, title, desc }) => (
  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-xl">{icon}</div>
    <div><p className="font-black text-sm">{title}</p><p className="text-xs text-slate-500">{desc}</p></div>
  </div>
);

const InputGroup = ({ label, icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-400 ml-1">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>}
      <input {...props} className={`w-full bg-[#0a0f1d] border border-white/5 rounded-xl py-3.5 ${icon?"pl-12":"pl-4"} pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all`} />
    </div>
  </div>
);

const SocialButton = ({ icon, text }) => (
  <button type="button" className="w-full flex items-center justify-center gap-3 py-3 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/5 transition-all">
    <img src={icon} alt="" className="w-4 h-4" /> {text}
  </button>
);

export default Login;
