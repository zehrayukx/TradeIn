import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useTheme, getThemeClasses } from '../context/ThemeContext';

export default function ChatBox({ currentUsername }) {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  const isDark = theme === 'dark';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://127.0.0.1:8000/ws/chat');
    ws.current.onmessage = (event) => {
      const incomingData = JSON.parse(event.data);
      setMessages((prev) => [...prev, incomingData]);
    };
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && ws.current) {
      ws.current.send(JSON.stringify({ username: currentUsername || 'Anonim', text: input }));
      setInput('');
    }
  };

  return (
    <div className={`flex flex-col h-[500px] w-full max-w-sm border ${t.cardBorder} rounded-2xl ${t.cardBg2} p-4 shadow-2xl transition-colors duration-300`}>
      <div className={`border-b ${t.divider} pb-3 mb-3`}>
        <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Canlı Piyasa Meydanı
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 flex flex-col">
        {messages.map((msg, index) => {
          const isMe = msg.username === (currentUsername || 'Anonim');
          return (
            <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className={`text-[10px] font-bold ${t.textMuted} mb-1 ml-1 tracking-wide`}>
                    {msg.username}
                  </span>
                )}
                <div className={`px-4 py-2.5 shadow-sm text-sm rounded-2xl ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : `${isDark ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-white text-gray-800 border border-gray-200'} rounded-bl-sm`
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Mesaj yaz..."
          className={`flex-1 ${t.inputBg} border ${t.inputBorder} rounded-xl pl-4 pr-10 py-2.5 ${t.textPrimary} outline-none focus:border-blue-500 transition-colors text-sm ${t.placeholder}`}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className={`absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 transition-colors ${isDark ? 'disabled:text-slate-600' : 'disabled:text-gray-300'}`}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
