import React from 'react';
import { MessageSquare, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

// 1. Yukarıdan (Home.jsx'ten) pasladığımız onLike fonksiyonunu içeri alıyoruz
const FeedCard = ({ post, onLike }) => {
  return (
    <div className="bg-[#1a1d26] border border-gray-800 rounded-2xl mb-4 overflow-hidden transition-all hover:border-gray-700">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Link to={`/profile/${post.user.name}`} className="flex items-center gap-3 group">
            <img src={post.user.avatar} alt={post.user.name} className="w-10 h-10 rounded-full object-cover border border-gray-700 group-hover:border-blue-500 transition-all" />
            <div>
              <h4 className="font-bold text-white group-hover:underline decoration-blue-500">{post.user.name}</h4>
              <p className="text-xs text-gray-500">{post.time}</p>
            </div>
          </Link>
          <button className="text-gray-500 hover:text-white"><MoreHorizontal size={20} /></button>
        </div>
        
        <p className="text-gray-200 mb-4 leading-relaxed">{post.content}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex items-center gap-6">
            
            {/* 2. Kalp butonuna tıklandığında onLike fonksiyonuna bu postun ID'sini uçuruyoruz */}
            <button 
              onClick={() => onLike && onLike(post.id)} 
              // isLiked true ise metin rengini direkt kırmızı yapıyoruz
              className={`flex items-center gap-2 transition-colors focus:outline-none ${
                post.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              {/* Lucide ikonunun 'fill' özelliğini kullanarak içini dolduruyoruz */}
              <Heart 
                size={18} 
                className={post.isLiked ? "fill-red-500" : ""} 
              /> 
              <span className="text-sm">{post.likes}</span>
            </button>
            
            <button className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors focus:outline-none">
              <MessageSquare size={18} /> 
              <span className="text-sm">{post.comments}</span>
            </button>
          </div>
          
          <button className="text-gray-400 hover:text-green-500 transition-colors focus:outline-none"><Share2 size={18} /></button>
        </div>
      </div>
    </div>
  );
};

export default FeedCard;