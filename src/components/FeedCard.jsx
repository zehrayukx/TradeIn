import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, CheckCircle } from 'lucide-react';

const FeedCard = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(post.isFollowed);

  return (
    <div className="bg-[#161a23] border border-gray-800 rounded-xl p-4 mb-4 hover:border-gray-700 transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          <img src={post.user.avatar} className="w-10 h-10 rounded-full" alt="" />
          <div>
            <div className="flex items-center gap-1 font-semibold">
              {post.user.name} 
              {post.user.isVerified && <CheckCircle size={14} className="text-blue-500 fill-current" />}
            </div>
            <span className="text-xs text-gray-500">{post.time}</span>
          </div>
        </div>
        <button 
          onClick={() => setFollowed(!followed)}
          className={`px-4 py-1 rounded-full text-sm font-medium transition ${
            followed ? 'bg-gray-700 text-white' : 'bg-blue-600 hover:bg-blue-500'
          }`}
        >
          {followed ? 'Takipte' : 'Takip Et'}
        </button>
      </div>

      <p className="text-gray-300 text-sm leading-relaxed mb-4">{post.content}</p>

      <div className="flex justify-between items-center text-gray-500 pt-2 border-t border-gray-800">
        <button onClick={() => setLiked(!liked)} className={`flex items-center gap-2 hover:text-red-500 ${liked ? 'text-red-500' : ''}`}>
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} /> <span className="text-xs">{post.likes}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-400">
          <MessageCircle size={18} /> <span className="text-xs">{post.comments}</span>
        </button>
        <button className="hover:text-green-400"><Share2 size={18} /></button>
        <button className="hover:text-yellow-500"><Bookmark size={18} /></button>
      </div>
    </div>
  );
};

export default FeedCard;
