import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AtSign, Mail, Lock, Globe, Phone, CheckCircle } from "lucide-react";
import { registerUser } from "../services/api"; //[cite: 30]

const Register = () => {
  const navigate = useNavigate(); //
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // API çağrısı simülasyonu[cite: 30]
      setTimeout(() => { 
        navigate("/dashboard"); // Başarılı kayıt sonrası yönlendirme
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white flex flex-col">
      <header className="p-6 flex justify-between items-center max-w-[1440px] w-full mx-auto">
        <div className="flex items-center gap-2 text-2xl font-black italic tracking-tighter">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm not-italic">TI</div>
          TRADEIN
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
            <p className="text-slate-400 text-sm mb-8">Hesabını oluştur ve topluluğa katıl</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Ad" placeholder="Adınız" />
                <InputGroup label="Soyad" placeholder="Soyadınız" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup icon={<AtSign size={16}/>} label="Kullanıcı Adı" placeholder="@kullaniciadi" />
                <InputGroup icon={<Mail size={16}/>} label="E-posta" placeholder="ornek@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup icon={<Lock size={16}/>} label="Şifre" type="password" placeholder="En az 8 karakter" />
                <InputGroup icon={<Lock size={16}/>} label="Şifre Tekrar" type="password" placeholder="Şifrenizi tekrar girin" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup icon={<Globe size={16}/>} label="Ülke" placeholder="Türkiye" />
                <InputGroup icon={<Phone size={16}/>} label="Telefon (Opsiyonel)" placeholder="5XX XXX XX XX" />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" className="mt-1 rounded bg-slate-800 border-white/5" />
                  <span><span className="text-blue-500">Kullanım Şartları</span> ve <span className="text-blue-500">Gizlilik Politikası</span>'nı kabul ediyorum.</span>
                </label>
              </div>

              <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all mt-4">
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
    </div>
  );
};

// Hataları Çözen Yardımcı Bileşen Tanımlamaları:
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

export default Register; // BU SATIR KRİTİKTİR, DIŞA AKTARIMI SAĞLAR.