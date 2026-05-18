import React, { useState, useEffect } from 'react'; // 🎯 DİKKAT: useEffect eklendi
import { MessageSquare, Heart, Share2, MoreHorizontal, Send, Edit2 } from 'lucide-react'; 

import { Link } from 'react-router-dom';
import axios from 'axios';

const FeedCard = ({ post, onLike, onEdit }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.comments || 0);

  useEffect(() => {
    setLocalCommentCount(post.comments || 0);
  }, [post.comments]);



  const toggleComments = () => {
    const willShow = !showComments;
    setShowComments(willShow);
    if (willShow) {
      fetchComments();
    }
  };

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/post/${post.id}/yorumlar`);
      setComments(res.data);
    } catch (error) {
      console.error("Yorumlar çekilemedi:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    const token = localStorage.getItem("tradein_token");
    
    if (!token || token === "undefined" || token === "null") {
      alert("Yorum yapmak için lütfen giriş yapın veya üye olun."); 
      return;
    }

    if (!newComment.trim()) return; 

    try {
      await axios.post(`http://127.0.0.1:8000/post/${post.id}/yorum`, 
        { content: newComment }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewComment(""); 
      setLocalCommentCount(prev => prev + 1); 
      fetchComments(); 
      
    } catch (error) {
      console.error("Yorum gönderilemedi:", error);
      alert("Yorum gönderilirken bir hata oluştu.");
    }
  };

return (
    <div className="bg-[#1a1d26] border border-gray-800 rounded-2xl mb-4 overflow-hidden transition-all hover:border-gray-700 shadow-lg">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Link to={`/profile/${post.user.name}`} className="flex items-center gap-3 group">
            <img src={post.user.avatar} alt={post.user.name} className="w-10 h-10 rounded-full object-cover border border-gray-700 group-hover:border-blue-500 transition-all" />
            <div>
              <h4 className="font-bold text-white group-hover:underline decoration-blue-500">{post.user.name}</h4>
              <p className="text-xs text-gray-500">{post.time}</p>
            </div>
          </Link>
          
          {/* 🎯 KİLİT NOKTA: onEdit varsa Kalem ikonu çıkar ve tıklanınca edit panelini açar */}
          {onEdit ? (
            <button onClick={() => onEdit(post)} className="text-gray-400 hover:text-blue-500 p-2 transition-colors" title="Gönderiyi Düzenle">
              <Edit2 size={18} />
            </button>
          ) : (
            <button className="text-gray-500 hover:text-white p-2"><MoreHorizontal size={20} /></button>
          )}
        </div>
        
        <p className="text-gray-200 mb-4 leading-relaxed">{post.content}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onLike && onLike(post.id)} 
              className={`flex items-center gap-2 transition-colors focus:outline-none ${post.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
            >
              <Heart size={18} className={post.isLiked ? "fill-red-500" : ""} /> 
              <span className="text-sm">{post.likes}</span>
            </button>
            
            <button 
              onClick={toggleComments} 
              className={`flex items-center gap-2 transition-colors focus:outline-none ${showComments ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
            >
              <MessageSquare size={18} className={showComments ? "fill-blue-500/20" : ""} /> 
              <span className="text-sm">{localCommentCount}</span>
            </button>
          </div>
          <button className="text-gray-400 hover:text-green-500 transition-colors focus:outline-none"><Share2 size={18} /></button>
        </div>

        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex gap-3 mb-6 relative">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                placeholder="Gönderiye yanıt ver..." 
                className="flex-1 bg-[#0a0f1d] border border-gray-700 rounded-xl pl-4 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button 
                onClick={handleSendComment}
                disabled={!newComment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 disabled:text-gray-600 p-1.5 transition-colors"
                title="Gönder"
              >
                <Send size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
              {isLoadingComments ? (
                <div className="text-center text-xs text-blue-500 py-4 animate-pulse">Yorumlar yükleniyor...</div>
              ) : comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3 items-start">
                    <img src={comment.avatar} alt={comment.yazar} className="w-8 h-8 rounded-full border border-gray-700 mt-1" />
                    <div className="bg-[#0a0f1d] p-3 rounded-2xl rounded-tl-none flex-1 border border-gray-800/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-white">{comment.yazar.toUpperCase()}</span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(comment.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-gray-500 py-4">Bu gönderiye ilk yorumu sen yap!</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedCard;