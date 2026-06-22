import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AtSign, Mail, Lock, Globe, Phone } from "lucide-react";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    ad: "",
    soyad: "",
    kullanici_adi: "",
    email: "",
    sifre: "",
    sifre_tekrar: "",
    ulke: "",
    telefon: ""
  });

  // 🚀 DOĞRULAMA MODALI STATE'LERİ
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.sifre !== formData.sifre_tekrar) {
      setError("Şifreler birbiriyle eşleşmiyor!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/kayit-ol", {
        username: formData.kullanici_adi, 
        email: formData.email,            
        password: formData.sifre          
      });

      console.log("🚀 Kayıt başarılı:", response.data);
      localStorage.setItem("tradein_username", formData.kullanici_adi.replace(/^@/, ''));
      
      // 🚀 YÖNLENDİRME İPTAL, POP-UP'I AÇ!
      setShowVerifyModal(true); 

    } catch (err) {
      console.error("Kayıt hatası:", err);
      const errorDetail = err.response?.data?.detail;

      if (err.response?.status === 400 || err.response?.status === 409) {
        if (typeof errorDetail === 'string' && (errorDetail.toLowerCase().includes("email") || errorDetail.toLowerCase().includes("kayıtlı"))) {
          setError("Bu e-posta adresi zaten kayıtlı! Lütfen giriş yapmayı dene.");
        } else if (typeof errorDetail === 'string' && (errorDetail.toLowerCase().includes("username") || errorDetail.toLowerCase().includes("kullanıcı adı"))) {
          setError("Bu kullanıcı adı zaten alınmış.");
        } else {
          setError(errorDetail || "Kayıt olurken bir hata oluştu.");
        }
      } else {
        setError("Sunucuya bağlanılamadı. Lütfen daha sonra tekrar dene.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 DOĞRULAMA İŞLEMİNİ YAPAN FONKSİYON
  const handleVerify = async () => {
    setIsVerifyLoading(true);
    setVerifyError("");
    try {
      await axios.post("http://127.0.0.1:8000/dogrula", {
        email: formData.email, // Formdan otomatik alıyoruz
        code: verifyCode
      });
      
      // Başarılı olursa login sayfasına uçur
      setShowVerifyModal(false);
      navigate("/login"); 
    } catch (error) {
      setVerifyError(error.response?.data?.detail || "Kod hatalı, lütfen tekrar dene.");
    } finally {
      setIsVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white flex flex-col relative">
      <header className="p-6 flex justify-between items-center max-w-[1440px] w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-lg shadow-blue-500/30">TI</div>
          <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">TradeIn</span>
        </div>
        <div className="text-sm text-slate-400">
          Zaten hesabın var mı? <Link to="/login" className="text-blue-500 font-bold hover:underline ml-1">Giriş Yap</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid md:grid-cols-[1fr_1.5fr] gap-12 items-center">
          <div className="hidden md:block space-y-8">
            <h1 className="text-4xl font-black leading-tight">Aramıza katıl,<br /><span className="text-blue-500">fırsatları yakala.</span></h1>
            <p className="text-slate-400 leading-relaxed">Binlerce yatırımcı ile birlikte piyasaları keşfet, analizlerini paylaş ve kazanmaya başla.</p>
            <div className="space-y-4">
              <FeatureItem icon="👥" title="50K+" desc="Aktif Yatırımcı" />
              <FeatureItem icon="📈" title="7/24" desc="Piyasa Takibi" />
              <FeatureItem icon="🛡️" title="Güvenli" desc="Verilerin Koruma Altında" />
            </div>
          </div>

          <div className="bg-[#161b22] border border-white/5 p-10 rounded-[32px] shadow-2xl">
            <h2 className="text-2xl font-black mb-2">Üye Ol</h2>
            <p className="text-slate-400 text-sm mb-6">Hesabını oluştur ve topluluğa katıl</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Ad" name="ad" value={formData.ad} onChange={handleChange} placeholder="Adınız" />
                <InputGroup label="Soyad" name="soyad" value={formData.soyad} onChange={handleChange} placeholder="Soyadınız" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup icon={<AtSign size={16}/>} label="Kullanıcı Adı" name="kullanici_adi" value={formData.kullanici_adi} onChange={handleChange} placeholder="@kullaniciadi" required />
                <InputGroup icon={<Mail size={16}/>} label="E-posta" name="email" value={formData.email} onChange={handleChange} placeholder="ornek@email.com" required type="email" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup icon={<Lock size={16}/>} label="Şifre" type="password" name="sifre" value={formData.sifre} onChange={handleChange} placeholder="En az 8 karakter" required minLength="8" />
                <InputGroup icon={<Lock size={16}/>} label="Şifre Tekrar" type="password" name="sifre_tekrar" value={formData.sifre_tekrar} onChange={handleChange} placeholder="Şifrenizi tekrar girin" required minLength="8" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup icon={<Globe size={16}/>} label="Ülke" name="ulke" value={formData.ulke} onChange={handleChange} placeholder="Türkiye" />
                <InputGroup icon={<Phone size={16}/>} label="Telefon (Opsiyonel)" name="telefon" value={formData.telefon} onChange={handleChange} placeholder="5XX XXX XX XX" />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" required className="mt-1 rounded bg-slate-800 border-white/5" />
                  <span><span className="text-blue-500">Kullanım Şartları</span> ve <span className="text-blue-500">Gizlilik Politikası</span>'nı kabul ediyorum.</span>
                </label>
              </div>

              <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all mt-4 disabled:bg-slate-800 disabled:text-slate-500">
                {isLoading ? "Kaydediliyor..." : "Üye Ol"}
              </button>
            </form>

            <div className="relative my-8 text-center">
              <span className="bg-[#161b22] px-4 text-slate-600 text-[10px] font-black uppercase tracking-widest relative z-10">veya</span>
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5" />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <SocialButton icon="https://www.google.com/favicon.ico" text="Google" />
               <SocialButton icon="https://www.apple.com/favicon.ico" text="Apple" />
            </div>
          </div>
        </div>
      </main>

      {/* 🚀 SİHİRLİ E-POSTA DOĞRULAMA POP-UP'I (MODAL) */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[32px] border border-blue-500/30 bg-[#161b22] shadow-2xl p-8 text-center">
            
            <div className="w-16 h-16 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/10">
              <Mail size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">E-postanı Kontrol Et!</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              <span className="text-blue-400 font-bold">{formData.email}</span> adresine 6 haneli bir doğrulama kodu gönderdik. Lütfen kodu aşağıya gir.
            </p>

            <input 
              type="text" 
              maxLength="6"
              placeholder="••••••"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))} // Sadece rakam kabul eder
              className="w-full text-center tracking-[0.7em] text-3xl font-black bg-[#0a0f1d] border border-white/5 rounded-2xl px-4 py-4 text-white outline-none focus:border-blue-500 transition-colors mb-2 placeholder:text-slate-700"
            />
            
            {verifyError && <p className="text-xs text-red-400 mb-4 font-bold">{verifyError}</p>}

            <button 
              onClick={handleVerify}
              disabled={verifyCode.length !== 6 || isVerifyLoading}
              className="w-full py-4 mt-6 rounded-xl text-sm font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none text-white shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              {isVerifyLoading ? "Doğrulanıyor..." : "Kodu Doğrula"}
            </button>
            
          </div>
        </div>
      )}

    </div>
  );
};

// Yardımcı Bileşenler
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
      <input {...props} className={`w-full bg-[#0a0f1d] border border-white/5 rounded-xl py-3.5 ${icon ? 'pl-12' : 'pl-4'} pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all`} />
    </div>
  </div>
);

const SocialButton = ({ icon, text }) => (
  <button type="button" className="w-full flex items-center justify-center gap-3 py-3 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/5 transition-all">
    <img src={icon} alt="" className="w-4 h-4" /> {text}
  </button>
);

export default Register;