import React, { useMemo, useState } from 'react';
import { X, TrendingUp, TrendingDown, Activity, ChevronDown } from 'lucide-react';

const fmt = (val) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(val);

const AssetDetailModal = ({ asset, currentPrice, onClose }) => {
  const isPositive = asset.color === "#10b981" || asset.change >= 0;
  const themeColor = isPositive ? '#10b981' : '#ef4444'; 

  const [timeRange, setTimeRange] = useState('1D');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const ranges = {
    '1H': { label: 'Son 1 Saat', count: 60, msStep: 60 * 1000 },
    '6H': { label: 'Son 6 Saat', count: 72, msStep: 5 * 60 * 1000 },
    '1D': { label: 'Son 24 Saat', count: 48, msStep: 30 * 60 * 1000 }
  };

  const chartData = useMemo(() => {
    const data = [];
    const { count, msStep } = ranges[timeRange];
    let lastClose = Number(currentPrice) || 100;
    
    const volatility = lastClose * (timeRange === '1H' ? 0.002 : timeRange === '6H' ? 0.005 : 0.015);
    
    for (let i = count; i >= 0; i--) {
      const time = new Date(Date.now() - i * msStep);
      const hour = time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      const open = lastClose;
      const close = open + (Math.random() * volatility * 2) - volatility;
      const high = Math.max(open, close) + (Math.random() * volatility * 0.5);
      const low = Math.min(open, close) - (Math.random() * volatility * 0.5);
      
      data.push({
        hour, open, high, low, close,
        isBullish: close >= open
      });
      lastClose = close;
    }
    
    const lastIndex = data.length - 1;
    data[lastIndex].close = Number(currentPrice);
    data[lastIndex].isBullish = Number(currentPrice) >= data[lastIndex].open;
    data[lastIndex].high = Math.max(data[lastIndex].open, data[lastIndex].close) + (Math.random() * volatility * 0.2);
    data[lastIndex].low = Math.min(data[lastIndex].open, data[lastIndex].close) - (Math.random() * volatility * 0.2);
    
    return data;
  }, [currentPrice, timeRange]);

  const minPrice = Math.min(...chartData.map(d => d.low)) * 0.998;
  const maxPrice = Math.max(...chartData.map(d => d.high)) * 1.002;
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-6xl rounded-3xl border border-slate-700 bg-[#161b22] shadow-2xl overflow-hidden flex flex-col">

        {/* Üst Başlık */}
        <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-start gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10"
                 style={{ backgroundColor: `${themeColor}20` }}>
              {asset.icon}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">{asset.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold" style={{ color: themeColor }}>
                  {fmt(currentPrice)} {asset.unit}
                </span>
                <span className={`flex items-center text-sm font-bold px-3 py-1 rounded-full ${isPositive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
                  {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                  {ranges[timeRange].label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-xl grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-slate-300 ml-8">
            <p><span className="font-semibold text-slate-500">Dönem İçi Yüksek:</span> {fmt(maxPrice)}</p>
            <p><span className="font-semibold text-slate-500">Dönem İçi Düşük:</span> {fmt(minPrice)}</p>
            <p><span className="font-semibold text-slate-500">İncelenen Mum:</span> {ranges[timeRange].count} Bar</p>
            <p><span className="font-semibold text-slate-500">Durum:</span> Canlı Akış</p>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* GRAFİK ALANI */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-blue-500" />
              <h3 className="text-lg font-black uppercase tracking-tight text-white">{asset.name} / {asset.unit} Mum Grafiği</h3>
            </div>
            
            <div className="relative z-50">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-[#1e293b] text-white px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-700 hover:border-blue-500 transition-colors"
              >
                {ranges[timeRange].label} <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-[#1e293b] border border-slate-600 rounded-xl shadow-2xl overflow-hidden py-1">
                  {Object.entries(ranges).map(([key, val]) => (
                    <button 
                      key={key} 
                      onClick={() => { setTimeRange(key); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${timeRange === key ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-[380px] bg-[#0d1117] rounded-3xl border border-slate-800 relative flex overflow-hidden">
            
            <div className="absolute inset-x-0 inset-y-6 flex flex-col justify-between px-6 pointer-events-none opacity-20 text-[11px] font-bold text-slate-500 z-0">
              {[1, 0.8, 0.6, 0.4, 0.2, 0].map((ratio, i) => (
                <div key={i} className="w-full flex items-center gap-3">
                    <span className="w-16 text-right truncate bg-[#0d1117] relative z-10 pr-2">{fmt(minPrice + (priceRange * ratio))}</span>
                    <div className="flex-1 border-t border-slate-500 border-solid"></div>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden relative z-10 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-[#0d1117]">
              
              <div className="h-full min-w-full w-max flex items-end pl-24 pr-12 py-6 gap-3">
                {chartData.map((data, i) => {
                  const highPct = ((data.high - minPrice) / priceRange) * 100;
                  const lowPct = ((data.low - minPrice) / priceRange) * 100;
                  const openPct = ((data.open - minPrice) / priceRange) * 100;
                  const closePct = ((data.close - minPrice) / priceRange) * 100;
                  
                  const bodyTop = Math.max(openPct, closePct);
                  const bodyBottom = Math.min(openPct, closePct);
                  const colorClass = data.isBullish ? "bg-emerald-500" : "bg-red-500";

                  return (
                    <div key={i} className="relative group flex flex-col justify-end items-center h-full cursor-crosshair w-4 shrink-0">
                      
                      <div className="absolute inset-y-0 w-8 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>

                      <div 
                        className={`absolute w-px ${colorClass} opacity-80`}
                        style={{ bottom: `${lowPct}%`, height: `${highPct - lowPct}%` }}
                      />
                      
                      <div 
                        className={`absolute w-full rounded-[2px] ${colorClass} shadow-sm z-10 group-hover:brightness-125 transition-all`}
                        style={{ bottom: `${bodyBottom}%`, height: `${Math.max(0.5, bodyTop - bodyBottom)}%` }}
                      />
                      
                      {i % 4 === 0 && (
                        <div className="absolute -bottom-6 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                          {data.hour}
                        </div>
                      )}
                      
                      {/* 🔥 İŞTE O UFAK KUTU: Artık fitilin hep %5 üstünde açılır, tavana asla çarpmaz ve taşmaz! */}
                      <div 
                        style={{ bottom: `${Math.min(highPct + 5, 80)}%` }}
                        className="absolute left-1/2 -translate-x-1/2 bg-[#1e293b] text-slate-200 p-3 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-2xl border border-slate-600 w-36 z-50"
                      >
                        <div className="text-xs font-bold text-slate-400 mb-2 border-b border-slate-700 pb-1">
                          Saat: {data.hour}
                        </div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Açılış:</span>
                          <span className="font-bold">{fmt(data.open)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Yüksek:</span>
                          <span className="font-bold text-emerald-400">{fmt(data.high)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Düşük:</span>
                          <span className="font-bold text-red-400">{fmt(data.low)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] mt-2 pt-1 border-t border-slate-700">
                          <span className="text-slate-400">Kapanış:</span>
                          <span className={`font-black ${data.isBullish ? 'text-emerald-400' : 'text-red-400'}`}>
                            {fmt(data.close)}
                          </span>
                        </div>
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AssetDetailModal;