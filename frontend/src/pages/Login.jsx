import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LineChart, Mail, Lock, Eye, EyeOff } from "lucide-react";
import axios from "axios";

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // FastAPI OAuth2 standartlarına uygun form-data paketi
      const loginParams = new URLSearchParams();
      loginParams.append("username", formData.identifier);
      loginParams.append("password", formData.password);

      // Backend'e giriş isteği atıyoruz
      const response = await axios.post("http://127.0.0.1:8000/login", loginParams, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // Token'ı al ve sakla
      const token = response.data.access_token;
      localStorage.setItem("tradein_token", token);
      // Kullanıcının girdiği identifier'ı username olarak kaydet
      localStorage.setItem("tradein_username", formData.identifier.replace(/^@/, ''));

      // Sisteme giriş yapıldığını bildir!
      setIsLoggedIn(true);

      // Başarılı girişten sonra ana sayfaya yolla
      navigate("/");
      
    } catch (err) {
      console.error("Giriş hatası:", err);
      const errorMessage = err.response?.data?.detail || "Giriş yapılamadı. Kullanıcı adı veya şifreyi kontrol et.";
      setError(errorMessage);
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
          Hesabın yok mu? <Link to="/register" className="text-blue-500 font-bold hover:underline ml-1">Üye Ol</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center">
          <div className="hidden md:block space-y-8">
            <h1 className="text-4xl font-black leading-tight">Tek platform.<br /><span className="text-blue-500">Tüm piyasalar.</span></h1>
            <p className="text-slate-400 leading-relaxed">Piyasaları takip et, analizlerini paylaş, topluluğa katıl ve yatırım fırsatlarını kaçırma.</p>
            
            <div className="space-y-4">
              <FeatureItem icon="👥" title="50K+" desc="Aktif Yatırımcı" />
              <FeatureItem icon="📈" title="7/24" desc="Piyasa Takibi" />
              <FeatureItem icon="🛡️" title="Güvenli" desc="Verilerin Koruma Altında" />
            </div>
          </div>

          <div className="bg-[#161b22] border border-white/5 p-10 rounded-[32px] shadow-2xl">
            <h2 className="text-2xl font-black mb-2">Giriş Yap</h2>
            <p className="text-slate-400 text-sm mb-6">Hesabına giriş yaparak devam et</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <InputGroup 
                label="E-posta veya Kullanıcı Adı" 
                icon={<Mail size={18}/>} 
                placeholder="ornek@email.com veya @kullaniciadi" 
                value={formData.identifier} 
                onChange={(e) => setFormData({...formData, identifier: e.target.value})} 
                required
              />
              
              <div className="relative">
                <InputGroup 
                  label="Şifre" 
                  icon={<Lock size={18}/>} 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Şifrenizi girin"
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[42px] text-slate-500 hover:text-white">
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>

              <div className="flex justify-between items-center text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400"><input type="checkbox" className="rounded bg-slate-800 border-white/5" /> Beni hatırla</label>
                <Link to="#" className="text-blue-500 font-bold hover:underline">Şifremi unuttum?</Link>
              </div>

              <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all">
                {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </button>
            </form>

            <div className="relative my-8 text-center">
              <span className="bg-[#161b22] px-4 text-slate-600 text-[10px] font-black uppercase tracking-widest relative z-10">veya</span>
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5" />
            </div>

            <div className="grid gap-3">
              <SocialButton icon="https://www.google.com/favicon.ico" text="Google ile Devam Et" />
              <SocialButton icon="https://www.apple.com/favicon.ico" text="Apple ile Devam Et" />
            </div>
          </div>
        </div>
      </main>
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
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>
      <input {...props} className="w-full bg-[#0a0f1d] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all" />
    </div>
  </div>
);

const SocialButton = ({ icon, text }) => (
  <button type="button" className="w-full flex items-center justify-center gap-3 py-3 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/5 transition-all">
    <img src={icon} alt="" className="w-4 h-4" /> {text}
  </button>
);

export default Login;