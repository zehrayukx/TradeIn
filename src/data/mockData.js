/**
 * TradeIn Mock Data
 * Bu dosya, backend API entegrasyonu tamamlanana kadar uygulamayı besleyecek
 * tüm statik verileri merkezi bir noktada toplar.
 */

// 1. Üstteki Yatay Fiyat Bandı (TickerTape) Verileri
export const TICKER_DATA = [
    { id: 1, pair: "BTC/USDT", price: "64,230.50", change: "+1.2%", isUp: true },
    { id: 2, pair: "ETH/USDT", price: "3,450.12", change: "-0.5%", isUp: false },
    { id: 3, pair: "XAU/USD", price: "2,350.40", change: "+0.8%", isUp: true },
    { id: 4, pair: "XAG/USD", price: "28.15", change: "+2.4%", isUp: true },
    { id: 5, pair: "BIST:100", price: "9,120.00", change: "-1.1%", isUp: false },
    { id: 6, pair: "SOL/USDT", price: "145.20", change: "+5.7%", isUp: true },
  ];
  
  // 2. Ana Akış (Feed) Gönderi Verileri
  export const POSTS_DATA = [
    {
      id: 1,
      user: { 
        name: "Zehra Kaya", 
        avatar: "https://i.pravatar.cc/150?u=zehra", 
        isVerified: true 
      },
      content: "Borsa İstanbul'daki bu yükseliş trendi devam edecek gibi görünüyor. Bankacılık endeksi öncülüğünde yeni rekorlar gelebilir. #borsa #hisse #endeks",
      time: "2 saat önce",
      likes: 124,
      comments: 12,
      isFollowed: false
    },
    {
      id: 2,
      user: { 
        name: "Mert Demir", 
        avatar: "https://i.pravatar.cc/150?u=mert", 
        isVerified: true 
      },
      content: "Altın fiyatlarında kısa vadeli bir düzeltme bekliyorum. 2300 dolar seviyesi kritik destek noktası. #altin #ons #piyasa",
      time: "5 saat önce",
      likes: 85,
      comments: 4,
      isFollowed: true
    },
    {
      id: 3,
      user: { 
        name: "Ece Seçkin", 
        avatar: "https://i.pravatar.cc/150?u=ece", 
        isVerified: false 
      },
      content: "Bitcoin 64k üzerinde kalıcı olabilecek mi? FOMC tutanakları sonrası volatilite artabilir. Dikkatli olmakta fayda var. 🚀",
      time: "8 saat önce",
      likes: 210,
      comments: 45,
      isFollowed: false
    }
  ];
  
  // 3. Sağ Panel: Trend Olan Etiketler (Trends)
  export const TRENDS = [
    { id: 1, tag: "#borsa", count: "12.4K gönderi" },
    { id: 2, tag: "#gumus", count: "8.2K gönderi" },
    { id: 3, tag: "#altin", count: "25.1K gönderi" },
    { id: 4, tag: "#bitcoin", count: "42.9K gönderi" },
  ];
  
  // 4. Sağ Panel: Önerilen Trader'lar (Recommended)
  export const RECOMMENDED_TRADERS = [
    { 
      id: 1, 
      name: "Ahmet Yılmaz", 
      username: "@ahmetyilmaz", 
      avatar: "https://i.pravatar.cc/150?u=1", 
      isVerified: true 
    },
    { 
      id: 2, 
      name: "Selin Borsa", 
      username: "@selintrader", 
      avatar: "https://i.pravatar.cc/150?u=2", 
      isVerified: false 
    },
    { 
      id: 3, 
      name: "Kripto Can", 
      username: "@kriptocan", 
      avatar: "https://i.pravatar.cc/150?u=3", 
      isVerified: true 
    },
  ];
