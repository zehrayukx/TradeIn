import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme, getThemeClasses } from '../context/ThemeContext';


const STATIC_MARKETS = [
  { pair: "XAU/TRY", price: "2,338.45", change: "+0.55%", isUp: true },
  { pair: "BIST100", price: "10,842", change: "+0.91%", isUp: true },
];


const FALLBACK_DATA = [
  { pair: "BTC/USD", price: "67,241.50", change: "+2.34%", isUp: true },
  { pair: "ETH/USD", price: "3,182.10", change: "+1.12%", isUp: true },
  { pair: "USD/TRY", price: "32.45", change: "-0.21%", isUp: false },
  { pair: "EUR/TRY", price: "35.12", change: "+0.08%", isUp: true },
  ...STATIC_MARKETS
];

const TickerTape = () => {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  
  const [tickerData, setTickerData] = useState(FALLBACK_DATA);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Tıpkı Markets sayfasındaki gibi Promise.all ile iki ayrı API'ye aynı anda çıkıyoruz
        const [fxResponse, cryptoResponse] = await Promise.all([
          fetch("https://open.er-api.com/v6/latest/USD"),
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana&vs_currencies=usd&include_24hr_change=true")
        ]);

        const fxData = await fxResponse.json();
        const cryptoData = await cryptoResponse.json();

        let liveTicker = [];


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

   
        if (fxData && fxData.rates) {
          const tryRate = fxData.rates.TRY;
          const eurRate = fxData.rates.EUR;
          const gbpRate = fxData.rates.GBP;

         
          liveTicker.push({
            pair: "USD/TRY",
            price: tryRate.toFixed(4),
            change: "+0.12%", 
            isUp: true
          });
          
          liveTicker.push({
            pair: "EUR/TRY",
            price: (tryRate / eurRate).toFixed(4),
            change: "-0.05%", 
            isUp: false
          });

          liveTicker.push({
            pair: "GBP/TRY",
            price: (tryRate / gbpRate).toFixed(4),
            change: "+0.08%",
            isUp: true
          });
        }

        // 3. STATİK VERİLERİ BİRLEŞTİR (Altın, BIST)
        setTickerData([...liveTicker, ...STATIC_MARKETS]);

      } catch (error) {
        console.error("Harici API'lerden veri çekilemedi:", error);
        // Hata durumunda state'i ellemiyoruz, baştaki FALLBACK_DATA dönmeye devam ediyor.
      }
    };

    fetchAllData();
    

    const interval = setInterval(fetchAllData, 60000); 
    

    return () => clearInterval(interval);
    
  }, []); 

  return (
    <div className={`w-full ${t.navBg} border-b ${t.navBorder} overflow-hidden py-2 select-none transition-colors duration-300`}>
      <div className="flex animate-marquee whitespace-nowrap">
        {}
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