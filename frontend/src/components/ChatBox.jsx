import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

export default function ChatBox({ currentUsername }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Tünele bağlan
    ws.current = new WebSocket('ws://127.0.0.1:8000/ws/chat');

    // Sunucudan mesaj (veya geçmiş) geldiğinde
    ws.current.onmessage = (event) => {
      const incomingData = JSON.parse(event.data);
      setMessages((prev) => [...prev, incomingData]);
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  // Yeni mesaj gelince en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && ws.current) {
      // Backend'e gönderilecek JSON paketi
      const payload = {
        username: currentUsername || "Anonim", // Piyasalar sayfasından gelen isim
        text: input
      };
      
      ws.current.send(JSON.stringify(payload));
      setInput(''); // Kutuyu temizle
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-sm border border-slate-700/50 rounded-2xl bg-[#161b22] p-4 shadow-2xl">
      {/* Üst Başlık */}
      <div className="border-b border-slate-700/50 pb-3 mb-3">
        <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Canlı Piyasa Meydanı
        </h3>
      </div>

      {/* Mesaj Listesi (WhatsApp Görünümü) */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 flex flex-col">
        {messages.map((msg, index) => {
          // Gelen mesaj benim mi?
          const isMe = msg.username === (currentUsername || "Anonim");

          return (
            <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                
                {/* Karşı tarafsa üstte ismini göster */}
                {!isMe && (
                  <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1 tracking-wide">
                    {msg.username}
                  </span>
                )}
                
                {/* WhatsApp Baloncuğu */}
                <div className={`px-4 py-2.5 shadow-sm text-sm ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl rounded-bl-sm'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>

              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Mesaj Gönderme Alanı */}
      <div className="flex gap-2 relative">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Mesaj yaz..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-white outline-none focus:border-blue-500 transition-colors text-sm"
        />
        <button 
          onClick={handleSend} 
          disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 disabled:text-slate-600 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}