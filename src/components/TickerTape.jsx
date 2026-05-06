// src/components/TickerTape.jsx
import React, { useMemo } from "react";

const TickerTape = ({ items = [], isLoading = false }) => {
  const marqueeItems = useMemo(() => [...items, ...items], [items]);

  if (isLoading || !items.length) {
    return (
      <div className="overflow-hidden border-t border-white/5 bg-[#0c1327] py-3">
        <div className="flex gap-3 px-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-8 w-28 animate-pulse rounded-full border border-white/5 bg-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes tradein-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .tradein-marquee {
          animation: tradein-marquee 24s linear infinite;
        }
      `}</style>

      <div className="overflow-hidden border-t border-white/5 bg-[#0c1327] py-3">
        <div className="tradein-marquee flex w-max items-center">
          {marqueeItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="mx-3 flex shrink-0 items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {item.pair}
              </span>
              <span className="text-sm font-bold text-white">{item.price}</span>
              <span
                className={`text-sm font-bold ${
                  item.isUp ? "text-green-400" : "text-red-400"
                }`}
              >
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TickerTape;