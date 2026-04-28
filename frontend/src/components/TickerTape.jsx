import React from 'react';
import { TICKER_DATA } from '../data/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TickerTape = () => {
  return (
    <div className="w-full bg-[#0d1117] border-b border-gray-800 overflow-hidden py-2 select-none">
      <div className="flex animate-marquee whitespace-nowrap">
        {/* Veriyi iki kez listeliyoruz ki sonsuz döngü efekti oluşsun */}
        {[...TICKER_DATA, ...TICKER_DATA].map((item, index) => (
          <div key={index} className="inline-flex items-center mx-6 gap-2">
            <span className="text-gray-400 font-medium text-xs">{item.pair}</span>
            <span className="text-white font-bold text-xs">{item.price}</span>
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
