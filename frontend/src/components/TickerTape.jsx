import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme, getThemeClasses } from '../context/ThemeContext';

const STATIC_MARKETS = [
  { pair: "BIST100", price: "11,200", change: "+0.75%", isUp: true },
];

const FALLBACK_DATA = [
  { pair: "BTC/USD", price: "68,500.00", change: "+1.20%", isUp: true },
  { pair: "ETH/USD", price: "3,450.10", change: "-0.45%", isUp: false },
  { pair: "USD/TRY", price: "32.20", change: "+0.15%", isUp: true },
  { pair: "EUR/TRY", price: "35.15", change: "+0.08%", isUp: true },
  { pair: "XAU/TRY (Gr)", price: "2,450.00", change: "+0.45%", isUp: true },
  ...STATIC_MARKETS
];

const TickerTape = () => {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  
  const [tickerData, setTickerData] = useState(FALLBACK_DATA);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const responses = await Promise.allSettled([
          fetch("https://open.er-api.com/v6/latest/USD"),
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana&vs_currencies=usd&include_24hr_change=true"),
          // 🚀 GOLDAPI.IO ENTEGRASYONU
          fetch("https://www.goldapi.io/api/XAU/TRY", {
            headers: {
              "x-access-token": "goldapi-20e7b14c71868c1919866bf5c7d57e7c-io", // Siteden aldığın key'i buraya yapıştır
              "Content-Type": "application/json"
            }
          })
        ]);

        let liveTicker = [];

        // 1. DÖVİZ VERİLERİ
        if (responses[0].status === "fulfilled") {
          try {
            const fxData = await responses[0].value.json();
            if (fxData && fxData.rates) {
              const tryRate = fxData.rates.TRY;
              const eurRate = fxData.rates.EUR;
              const gbpRate = fxData.rates.GBP;

              liveTicker.push({ pair: "USD/TRY", price: tryRate.toFixed(2), change: "+0.18%", isUp: true });
              liveTicker.push({ pair: "EUR/TRY", price: (tryRate / eurRate).toFixed(2), change: "+0.22%", isUp: true });
              liveTicker.push({ pair: "GBP/TRY", price: (tryRate / gbpRate).toFixed(2), change: "-0.05%", isUp: false });
            }
          } catch (e) { console.error("Döviz hatası:", e); }
        }

        // 2. KRİPTO VERİLERİ
        if (responses[1].status === "fulfilled") {
          try {
            const cryptoData = await responses[1].value.json();
            if (cryptoData) {
              const cryptos = [
                { id: 'bitcoin', pair: 'BTC/USD' },
                { id: 'ethereum', pair: 'ETH/USD' },
                { id: 'binancecoin', pair: 'BNB/USD' },
                { id: 'solana', pair: 'SOL/USD' }
              ];
              cryptos.forEach(c => {
                if (cryptoData[c.id]) {
                  const data = cryptoData[c.id];
                  liveTicker.push({
                    pair: c.pair,
                    price: data.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    change: `${data.usd_24h_change > 0 ? '+' : ''}${data.usd_24h_change.toFixed(2)}%`,
                    isUp: data.usd_24h_change >= 0
                  });
                }
              });
            }
          } catch (e) { console.error("Kripto hatası:", e); }
        }

        // 3. 🚀 ALTIN VERİSİ (GRAM ALTIN HESAPLAMASI)
        if (responses[2].status === "fulfilled") {
          try {
            const goldData = await responses[2].value.json();
            if (goldData && goldData.price) {
              // Ons fiyatını 31.1034768'e bölerek Gram Altın/TL fiyatını buluyoruz
              const gramAltinTL = goldData.price / 31.1034768;
              liveTicker.push({
                pair: "XAU/TRY (Gr)",
                price: gramAltinTL.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                change: "+0.35%", // GoldAPI anlık değişim vermezse simüle edilebilir
                isUp: true
              });
            }
          } catch (e) { console.error("Altın hatası:", e); }
        }

        if (liveTicker.length > 0) {
          setTickerData([...liveTicker, ...STATIC_MARKETS]);
        }

      } catch (error) {
        console.error("Genel veri çekme hatası:", error);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 60000); 
    return () => clearInterval(interval);
  }, []); 

  return (
    <div className={`w-full ${t.navBg} border-b ${t.navBorder} overflow-hidden py-2 select-none transition-colors duration-300`}>
      <div className="flex animate-marquee whitespace-nowrap">
        {[...tickerData, ...tickerData, ...tickerData].map((item, index) => (
          <div key={index} className="inline-flex items-center mx-6 gap-2">
            <span className={`${t.textSecond} font-medium text-xs`}>{item.pair}</span>
            <span className={`${t.textPrimary} font-bold text-xs`}>{item.price}</span>
            <span className={`flex items-center text-[10px] font-semibold ${item.isUp ? 'text-green-500' : 'text-red-500'}`}>
              {item.isUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerTape;