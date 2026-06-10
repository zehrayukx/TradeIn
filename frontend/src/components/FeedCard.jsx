import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Share2, MoreHorizontal, Send, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, getThemeClasses } from '../context/ThemeContext';

// 🚀 1. ADIM: onDelete prop'unu yukarıdaki parantezin içine ekledik
const FeedCard = ({ post, onLike, onEdit, currentUser, onDelete }) => {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
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
    if (willShow) fetchComments();
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

  // YORUM SİLME FONKSİYONU
  const handleDeleteComment = async (commentId) => {
    const isConfirmed = window.confirm("Bu yorumu silmek istediğinize emin misiniz?");
    if (!isConfirmed) return;

    const token = localStorage.getItem("tradein_token");
    if (!token) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/post/yorum-sil/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      setLocalCommentCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error("Yorum silinirken hata oluştu:", error);
      if (error.response && error.response.status === 403) {
        alert("Sadece kendi yorumlarınızı silebilirsiniz!");
      } else {
        alert("Yorum silinirken bir hata oluştu.");
      }
    }
  };

  return (
    <div className={`${t.cardBg} border ${t.cardBorder} rounded-2xl mb-4 overflow-hidden transition-all hover:border-blue-500/30 shadow-lg`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Link to={`/profile/${post.user.name}`} className="flex items-center gap-3 group">
            <img src={post.user.avatar} alt={post.user.name} className={`w-10 h-10 rounded-full object-cover border ${t.cardBorder} group-hover:border-blue-500 transition-all`} />
            <div>
              <h4 className={`font-bold ${t.textPrimary} group-hover:underline decoration-blue-500`}>{post.user.name}</h4>
              <p className={`text-xs ${t.textMuted}`}>{post.time}</p>
            </div>
          </Link>
          
          {/* 🚀 2. ADIM: GÖNDERİ BAŞLIĞINDAKİ BUTON ALANINI AKILLI HALE GETİRDİK */}
          <div className="flex items-center gap-1">
            {/* Düzenleme yetkisi (onEdit) varsa kalemi göster */}
            {onEdit && (
              <button onClick={() => onEdit(post)} className={`${t.textSecond} hover:text-blue-500 p-2 transition-colors`} title="Gönderiyi Düzenle">
                <Edit2 size={18} />
              </button>
            )}
            
            {/* Silme yetkisi (onDelete) varsa aslanlar gibi çöp kutusunu göster */}
            {onDelete && (
              <button 
                onClick={() => onDelete(post.id)} 
                className="text-red-500/70 hover:text-red-500 p-2 transition-colors" 
                title="Gönderiyi Sil"
              >
                <Trash2 size={18} />
              </button>
            )}

            {/* Eğer ikisi de yoksa (başkasının profilindeysek) sadece klasik üç noktayı göster */}
            {!onEdit && !onDelete && (
              <button className={`${t.textMuted} hover:${t.textPrimary} p-2`}><MoreHorizontal size={20} /></button>
            )}
          </div>
        </div>

        {/* Gönderi İçeriği */}
        <p className={`${t.textPrimary} mb-4 leading-relaxed`}>{post.content}</p>

        {/* Alt Etkileşim Butonları (Beğeni, Yorum Aç/Kapat, Paylaş) */}
        <div className={`flex items-center justify-between pt-4 border-t ${t.divider}`}>
          <div className="flex items-center gap-6">
            <button
              onClick={() => onLike && onLike(post.id)}
              className={`flex items-center gap-2 transition-colors focus:outline-none ${post.isLiked ? 'text-red-500' : `${t.textSecond} hover:text-red-500`}`}
            >
              <Heart size={18} className={post.isLiked ? "fill-red-500" : ""} />
              <span className="text-sm">{post.likes}</span>
            </button>
            <button
              onClick={toggleComments}
              className={`flex items-center gap-2 transition-colors focus:outline-none ${showComments ? 'text-blue-500' : `${t.textSecond} hover:text-blue-500`}`}
            >
              <MessageSquare size={18} className={showComments ? "fill-blue-500/20" : ""} />
              <span className="text-sm">{localCommentCount}</span>
            </button>
          </div>
          <button className={`${t.textSecond} hover:text-green-500 transition-colors focus:outline-none`}><Share2 size={18} /></button>
        </div>

        {/* Yorumlar Bölümü */}
        {showComments && (
          <div className={`mt-4 pt-4 border-t ${t.divider} animate-in fade-in slide-in-from-top-2 duration-300`}>
            <div className="flex gap-3 mb-6 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                placeholder="Gönderiye yanıt ver..."
                className={`flex-1 ${t.inputBg} border ${t.inputBorder} rounded-xl pl-4 pr-12 py-2.5 text-sm ${t.textPrimary} focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all`}
              />
              <button
                onClick={handleSendComment}
                disabled={!newComment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 disabled:text-gray-400 p-1.5 transition-colors"
                title="Gönder"
              >
                <Send size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
              {isLoadingComments ? (
                <div className="text-center text-xs text-blue-500 py-4 animate-pulse">Yorumlar yükleniyor...</div>
              ) : comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3 items-start group">
                    <img src={comment.avatar} alt={comment.yazar} className={`w-8 h-8 rounded-full border ${t.cardBorder} mt-1`} />
                    <div className={`${t.cardBg2} p-3 rounded-2xl rounded-tl-none flex-1 border ${t.cardBorder} relative`}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs ${t.textPrimary}`}>{comment.yazar.toUpperCase()}</span>
                          <span className={`text-[10px] ${t.textMuted}`}>
                            {new Date(comment.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {currentUser && currentUser.name.toLowerCase() === comment.yazar.toLowerCase() && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500/50 hover:text-red-600 p-1 rounded-full hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Yorumu Sil"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                      <p className={`text-sm ${t.textSecond} leading-relaxed`}>{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`text-center text-xs ${t.textMuted} py-4`}>Bu gönderiye ilk yorumu sen yap!</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedCard;