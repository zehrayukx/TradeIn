import React from 'react';
import { RECOMMENDED_TRADERS } from '../data/mockData';
import { CheckCircle } from 'lucide-react';

const RecommendedTraders = () => {
  return (
    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 w-full mt-6">
      <h2 className="text-xl font-bold text-white mb-4 px-2">Kimi Takip Etmeli</h2>
      
      <div className="space-y-5">
        {RECOMMENDED_TRADERS.map((trader) => (
          <div key={trader.id} className="flex items-center justify-between px-2 group">
            <div className="flex items-center gap-3">
              <img 
                src={trader.avatar} 
                className="w-10 h-10 rounded-full border border-gray-700" 
                alt={trader.name} 
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-sm font-bold text-white">
                  {trader.name}
                  {trader.isVerified && <CheckCircle size={14} className="text-blue-500 fill-current" />}
                </div>
                <span className="text-gray-500 text-xs">{trader.username}</span>
              </div>
            </div>
            
            <button className="bg-white text-black hover:bg-gray-200 px-4 py-1.5 rounded-full text-xs font-bold transition-colors">
              Takip Et
            </button>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-2 text-sm text-blue-500 hover:text-blue-400 font-medium transition-colors">
        Hepsini gör
      </button>
    </div>
  );
};

export default RecommendedTraders;
