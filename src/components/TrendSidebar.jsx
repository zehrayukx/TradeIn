import React from 'react';
import { TRENDS } from '../data/mockData';
import { Settings } from 'lucide-react';

const TrendSidebar = () => {
  return (
    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 w-full">
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-xl font-bold text-white">Trendler</h2>
        <button className="text-gray-500 hover:text-blue-500 transition-colors">
          <Settings size={18} />
        </button>
      </div>

      <div className="space-y-4">
        {TRENDS.map((trend) => (
          <div 
            key={trend.id} 
            className="px-2 py-2 hover:bg-white/5 rounded-xl cursor-pointer transition-all group"
          >
            <p className="text-blue-500 font-medium text-sm group-hover:underline">
              {trend.tag}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {trend.count}
            </p>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2 text-sm text-blue-500 hover:text-blue-400 font-medium transition-colors">
        Daha fazla göster
      </button>
    </div>
  );
};

export default TrendSidebar;
