import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Share2, MoreHorizontal, Send, Edit2, Trash2, X, Check } from 'lucide-react'; // 🚀 Edit2, X ve Check eklendi
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, getThemeClasses } from '../context/ThemeContext';

const FeedCard = ({ post, onLike, onEdit, currentUser, onDelete }) => {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.comments || 0);

  // 🚀 YORUM DÜZENLEME STATE'LERİ
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");

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
      alert(error.response?.data?.detail || "Yorum gönderilirken bir hata oluştu.");
    }
  };

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
      alert(error.response?.data?.detail || "Yorum silinirken bir hata oluştu.");
    }
  };

  // 🚀 YORUM GÜNCELLEME FONKSİYONU
  const handleUpdateComment = async (commentId) => {
    if (!editCommentContent.trim()) return;
    
    const token = localStorage.getItem("tradein_token");
    if (!token) return;

    try {
      const response = await axios.put(`http://127.0.0.1:8000/post/yorum-guncelle/${commentId}`, 
        { content: editCommentContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Ekranda listeyi anında güncelle
      setComments(prevComments => prevComments.map(c => 
        c.id === commentId ? { ...c, content: editCommentContent } : c
      ));
      
      // Düzenleme modundan çık
      setEditingCommentId(null);
      
    } catch (error) {
      alert(error.response?.data?.detail || "Yorum güncellenirken bir hata oluştu.");
    }
  };

  return (
    <div className={`${t.cardBg} border ${t.cardBorder} rounded-2xl mb-4 overflow-hidden transition-all hover:border-blue-500/30 shadow-lg`}>
      <div className="p-4">
        {/* Gönderi Başlığı ve Butonları */}
        <div className="flex items-center justify-between mb-4">
          <Link to={`/profile/${post.user.name}`} className="flex items-center gap-3 group">
            <img src={post.user.avatar} alt={post.user.name} className={`w-10 h-10 rounded-full object-cover border ${t.cardBorder} group-hover:border-blue-500 transition-all`} />
            <div>
              <h4 className={`font-bold ${t.textPrimary} group-hover:underline decoration-blue-500`}>{post.user.name}</h4>
              <p className={`text-xs ${t.textMuted}`}>{post.time}</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-1">
            {onEdit && (
              <button onClick={() => onEdit(post)} className={`${t.textSecond} hover:text-blue-500 p-2 transition-colors`} title="Gönderiyi Düzenle">
                <Edit2 size={18} />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(post.id)} className="text-red-500/70 hover:text-red-500 p-2 transition-colors" title="Gönderiyi Sil">
                <Trash2 size={18} />
              </button>
            )}
            {!onEdit && !onDelete && (
              <button className={`${t.textMuted} hover:${t.textPrimary} p-2`}><MoreHorizontal size={20} /></button>
            )}
          </div>
        </div>

        <p className={`${t.textPrimary} mb-4 leading-relaxed whitespace-pre-wrap`}>{post.content}</p>

        {/* Etkileşim Butonları */}
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
                    
                    <div className={`${t.cardBg2} p-3 rounded-2xl rounded-tl-none flex-1 border ${t.cardBorder} relative transition-all`}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs ${t.textPrimary}`}>{comment.yazar.toUpperCase()}</span>
                          <span className={`text-[10px] ${t.textMuted}`}>
                            {new Date(comment.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        {/* 🚀 SAHİBİNE ÖZEL KALEM VE ÇÖP KUTUSU */}
                        {currentUser && currentUser.name.toLowerCase() === comment.yazar.toLowerCase() && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditCommentContent(comment.content);
                              }}
                              className="text-blue-500/60 hover:text-blue-500 p-1 rounded-full hover:bg-blue-500/10 transition-colors"
                              title="Yorumu Düzenle"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-500/60 hover:text-red-600 p-1 rounded-full hover:bg-red-500/10 transition-colors"
                              title="Yorumu Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 🚀 YORUM DÜZENLEME EKRANI VEYA NORMAL METİN */}
                      {editingCommentId === comment.id ? (
                        <div className="mt-2 flex flex-col gap-2">
                          <textarea
                            autoFocus
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            className={`w-full ${t.inputBg} border border-blue-500 rounded-lg p-2 text-sm ${t.textPrimary} outline-none resize-none min-h-[60px]`}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingCommentId(null)} className={`text-xs px-3 py-1.5 rounded-lg border ${t.cardBorder} ${t.hoverBg} ${t.textSecond} flex items-center gap-1`}>
                              <X size={12} /> İptal
                            </button>
                            <button onClick={() => handleUpdateComment(comment.id)} disabled={!editCommentContent.trim()} className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:bg-gray-500 flex items-center gap-1">
                              <Check size={12} /> Kaydet
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-sm ${t.textSecond} leading-relaxed whitespace-pre-wrap`}>{comment.content}</p>
                      )}
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