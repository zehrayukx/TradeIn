import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme, getThemeClasses } from '../context/ThemeContext';

const TICKER_DATA = [
  { pair: "BTC/USD", price: "67,241.50", change: "+2.34%", isUp: true },
  { pair: "ETH/USD", price: "3,182.10", change: "+1.12%", isUp: true },
  { pair: "USD/TRY", price: "32.45", change: "-0.21%", isUp: false },
  { pair: "EUR/TRY", price: "35.12", change: "+0.08%", isUp: true },
  { pair: "XAU/TRY", price: "1985.5", change: "+0.55%", isUp: true },
  { pair: "GBP/TRY", price: "41.22", change: "-0.14%", isUp: false },
  { pair: "BIST100", price: "10,842", change: "+0.91%", isUp: true },
];

const TickerTape = () => {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  return (
    <div className={`w-full ${t.navBg} border-b ${t.navBorder} overflow-hidden py-2 select-none transition-colors duration-300`}>
      <div className="flex animate-marquee whitespace-nowrap">
        {[...TICKER_DATA, ...TICKER_DATA].map((item, index) => (
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
